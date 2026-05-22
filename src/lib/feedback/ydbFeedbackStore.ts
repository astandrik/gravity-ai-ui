import { EnvironCredentialsProvider } from "@ydbjs/auth/environ";
import { Driver } from "@ydbjs/core";
import { query, type QueryClient } from "@ydbjs/query";
import { Bytes, Int32, Utf8, Uint64 } from "@ydbjs/value/primitive";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import type {
  DesignFeedbackInput,
  LikedDesignExample,
  PublishedDesign,
  SavedDesignFeedback,
} from "./designFeedback";
import {
  createPublishedDesignSlug,
  decodePublishedDesignId,
  getFeedbackPayloadSummary,
  getFeedbackPayloadTitle,
  isPublishedDesignSlug,
  toSavedFeedback,
} from "./designFeedback";
import { composedInterfaceArgumentsSchema } from "@/lib/agent/composedInterface";

type YdbFeedbackClient = {
  driver: Driver;
  sql: QueryClient;
  ready: Promise<void>;
  table: string;
  slugTable: string;
};

type FeedbackRow = {
  feedback_id?: string | null;
  gallery_slug?: string | null;
  published?: boolean | bigint | number | string | null;
  thumbnail_webp?: Uint8Array | string | null;
  thumbnail_png?: Uint8Array | string | null;
  thumbnail_width?: bigint | number | string | null;
  thumbnail_height?: bigint | number | string | null;
  thumbnail_generated_at_ms?: bigint | number | string | null;
  thumbnail_error?: string | null;
  thumbnail_attempted_at_ms?: bigint | number | string | null;
  prompt?: string | null;
  title?: string | null;
  summary?: string | null;
  surface_id?: string | null;
  payload_json?: string | null;
  created_at_ms?: bigint | number | string | null;
};

export type PublishedDesignSitemapEntry = {
  id: string;
  createdAtMs: number;
};

export type PublishedDesignThumbnailFormat = "webp" | "png";

export type PublishedDesignThumbnailBytes = {
  bytes: Buffer;
  contentType: "image/webp" | "image/png";
  width: number;
  height: number;
  generatedAtMs: number;
};

export type SavePublishedDesignThumbnailInput = {
  id: string;
  png: Uint8Array;
  webp: Uint8Array;
  width: number;
  height: number;
  generatedAtMs?: number;
};

export type PublishedDesignThumbnailBackfillEntry = {
  id: string;
  createdAtMs: number;
};

export type PublishedDesignSlugEntry = {
  gallerySlug: string;
  feedbackId: string;
  createdAtMs: number;
};

const PUBLISHED_SLUG_BACKFILL_LIMIT = 50_000;
const PUBLISHED_SLUG_UPSERT_CONCURRENCY = 8;

let clientPromise: Promise<YdbFeedbackClient> | undefined;
let ensureTablePromise: Promise<void> | undefined;

export async function saveDesignFeedback(
  input: DesignFeedbackInput,
): Promise<SavedDesignFeedback> {
  const saved = toSavedFeedback(input);
  const client = await getClient();

  await ensureFeedbackTable(client);
  const title = getFeedbackPayloadTitle(saved.payload);
  const summary = getFeedbackPayloadSummary(saved.payload);

  await client.sql`
    UPSERT INTO ${client.sql.identifier(client.table)}
      (
        feedback_id,
        gallery_slug,
        conversation_id,
        turn_id,
        rating,
        published,
        prompt,
        title,
        summary,
        surface_id,
        payload_json,
        messages_json,
        data_model_json,
        created_at_ms
      )
    VALUES
      (
        ${new Utf8(saved.feedbackId)},
        ${new Utf8(saved.gallerySlug)},
        ${new Utf8(saved.conversationId)},
        ${new Utf8(saved.turnId)},
        ${new Int32(saved.rating)},
        ${new Int32(saved.publish ? 1 : 0)},
        ${new Utf8(saved.prompt ?? "")},
        ${new Utf8(title)},
        ${new Utf8(summary)},
        ${new Utf8(saved.payload.surfaceId)},
        ${new Utf8(JSON.stringify(saved.payload))},
        ${new Utf8(JSON.stringify(saved.messages))},
        ${new Utf8(JSON.stringify(saved.dataModel ?? null))},
        ${new Uint64(BigInt(saved.createdAtMs))}
      )
  `;

  await upsertPublishedDesignSlug(client, {
    gallerySlug: saved.gallerySlug,
    feedbackId: saved.feedbackId,
    createdAtMs: saved.createdAtMs,
  });

  return saved;
}

export async function listPublishedDesigns(limit = 48) {
  const client = await getClient();

  await ensureFeedbackTable(client);

  const rows = await client.sql<[FeedbackRow]>`
    SELECT
      feedback_id,
      gallery_slug,
      prompt,
      title,
      summary,
      surface_id,
      thumbnail_width,
      thumbnail_height,
      thumbnail_generated_at_ms,
      payload_json,
      published,
      created_at_ms
    FROM ${client.sql.identifier(client.table)}
    WHERE rating = 1 AND published = 1
    ORDER BY created_at_ms DESC
    LIMIT ${new Uint64(BigInt(limit))}
  `;

  return (rows[0] ?? []).flatMap(rowToPublishedDesign);
}

export async function getPublishedDesignById(id: string) {
  const client = await getClient();

  await ensureFeedbackTable(client);

  if (isPublishedDesignSlug(id)) {
    return getPublishedDesignBySlug(client, id);
  }

  const feedbackId = decodePublishedDesignId(id);

  if (!feedbackId) {
    return null;
  }

  return getPublishedDesignByFeedbackId(client, feedbackId);
}

export async function backfillPublishedDesignSlugs(
  limit = PUBLISHED_SLUG_BACKFILL_LIMIT,
) {
  const client = await getClient();

  await ensureFeedbackTable(client);

  return backfillPublishedDesignSlugEntries(client, limit);
}

export async function listPublishedDesignSitemapEntries(limit = 50_000) {
  const client = await getClient();

  await ensureFeedbackTable(client);

  const rows = await client.sql<[FeedbackRow]>`
    SELECT feedback_id, gallery_slug, title, payload_json, published, created_at_ms
    FROM ${client.sql.identifier(client.table)}
    WHERE rating = 1 AND published = 1
    ORDER BY created_at_ms DESC
    LIMIT ${new Uint64(BigInt(limit))}
  `;

  return (rows[0] ?? []).flatMap((row) =>
    rowToPublishedDesign(row).map(({ createdAtMs, id }) => ({
      id,
      createdAtMs,
    })),
  );
}

export async function listLikedDesignExamples(limit = 3) {
  const client = await getClient();

  await ensureFeedbackTable(client);

  const rows = await client.sql<[FeedbackRow]>`
    SELECT prompt, payload_json, published
    FROM ${client.sql.identifier(client.table)}
    WHERE rating = 1 AND published = 1
    ORDER BY created_at_ms DESC
    LIMIT ${new Uint64(BigInt(limit))}
  `;

  return (rows[0] ?? []).flatMap(rowToLikedExample);
}

export async function listPublishedDesignsMissingThumbnails(
  limit = 100,
): Promise<PublishedDesignThumbnailBackfillEntry[]> {
  const client = await getClient();

  await ensureFeedbackTable(client);

  const rows = await client.sql<[FeedbackRow]>`
    SELECT
      feedback_id,
      gallery_slug,
      title,
      payload_json,
      published,
      thumbnail_generated_at_ms,
      created_at_ms
    FROM ${client.sql.identifier(client.table)}
    WHERE rating = 1 AND published = 1 AND thumbnail_generated_at_ms IS NULL
    ORDER BY created_at_ms DESC
    LIMIT ${new Uint64(BigInt(limit))}
  `;

  return (rows[0] ?? []).flatMap((row) =>
    rowToPublishedDesign(row).map(({ createdAtMs, id }) => ({
      id,
      createdAtMs,
    })),
  );
}

export async function savePublishedDesignThumbnail({
  id,
  png,
  webp,
  width,
  height,
  generatedAtMs = Date.now(),
}: SavePublishedDesignThumbnailInput) {
  const client = await getClient();

  await ensureFeedbackTable(client);
  const feedbackId = await getPublishedFeedbackIdByDesignId(client, id);

  if (!feedbackId) {
    throw new Error(`Published design not found: ${id}`);
  }

  await client.sql`
    UPDATE ${client.sql.identifier(client.table)}
    SET
      thumbnail_webp = ${new Bytes(webp)},
      thumbnail_png = ${new Bytes(png)},
      thumbnail_width = ${new Int32(width)},
      thumbnail_height = ${new Int32(height)},
      thumbnail_generated_at_ms = ${new Uint64(BigInt(generatedAtMs))},
      thumbnail_error = ${new Utf8("")},
      thumbnail_attempted_at_ms = ${new Uint64(BigInt(generatedAtMs))}
    WHERE feedback_id = ${new Utf8(feedbackId)} AND rating = 1 AND published = 1
  `;
}

export async function savePublishedDesignThumbnailError(
  id: string,
  error: string,
  attemptedAtMs = Date.now(),
) {
  const client = await getClient();

  await ensureFeedbackTable(client);
  const feedbackId = await getPublishedFeedbackIdByDesignId(client, id);

  if (!feedbackId) {
    return;
  }

  await client.sql`
    UPDATE ${client.sql.identifier(client.table)}
    SET
      thumbnail_error = ${new Utf8(error.slice(0, 2000))},
      thumbnail_attempted_at_ms = ${new Uint64(BigInt(attemptedAtMs))}
    WHERE feedback_id = ${new Utf8(feedbackId)} AND rating = 1 AND published = 1
  `;
}

export async function getPublishedDesignThumbnail(
  id: string,
  format: PublishedDesignThumbnailFormat,
): Promise<PublishedDesignThumbnailBytes | null> {
  const client = await getClient();

  await ensureFeedbackTable(client);
  const feedbackId = await getPublishedFeedbackIdByDesignId(client, id);

  if (!feedbackId) {
    return null;
  }

  const rows =
    format === "webp"
      ? await client.sql<[FeedbackRow]>`
          SELECT
            thumbnail_webp,
            thumbnail_width,
            thumbnail_height,
            thumbnail_generated_at_ms
          FROM ${client.sql.identifier(client.table)}
          WHERE feedback_id = ${new Utf8(feedbackId)} AND rating = 1 AND published = 1
          LIMIT ${new Uint64(BigInt(1))}
        `
      : await client.sql<[FeedbackRow]>`
          SELECT
            thumbnail_png,
            thumbnail_width,
            thumbnail_height,
            thumbnail_generated_at_ms
          FROM ${client.sql.identifier(client.table)}
          WHERE feedback_id = ${new Utf8(feedbackId)} AND rating = 1 AND published = 1
          LIMIT ${new Uint64(BigInt(1))}
        `;
  const row = (rows[0] ?? [])[0] ?? null;
  const bytes = readBytes(format === "webp" ? row?.thumbnail_webp : row?.thumbnail_png);
  const width = readPositiveInteger(row?.thumbnail_width);
  const height = readPositiveInteger(row?.thumbnail_height);
  const generatedAtMs = readCreatedAtMs(row?.thumbnail_generated_at_ms);

  if (!bytes || width === null || height === null || generatedAtMs === null) {
    return null;
  }

  return {
    bytes,
    contentType: format === "webp" ? "image/webp" : "image/png",
    width,
    height,
    generatedAtMs,
  };
}

async function getClient() {
  clientPromise ??= createClient();

  return clientPromise;
}

async function createClient(): Promise<YdbFeedbackClient> {
  const connectionString = getConnectionString();
  applyYdbCredentialsEnv();
  const credentialsProvider = new EnvironCredentialsProvider(connectionString);
  const driver = new Driver(connectionString, {
    credentialsProvider,
    secureOptions: credentialsProvider.secureOptions,
    "ydb.sdk.enable_discovery": false,
  });

  const table = getFeedbackTableName();
  const client = {
    driver,
    sql: query(driver, { poolOptions: { maxSize: 4 } }),
    ready: driver.ready(),
    table,
    slugTable: getGallerySlugTableName(table),
  };

  await client.ready;

  return client;
}

async function ensureFeedbackTable(client: YdbFeedbackClient) {
  ensureTablePromise ??= (async () => {
    await client.sql`
      CREATE TABLE IF NOT EXISTS ${client.sql.identifier(client.table)} (
        feedback_id Utf8 NOT NULL,
        gallery_slug Utf8,
        conversation_id Utf8 NOT NULL,
        turn_id Utf8 NOT NULL,
        rating Int32 NOT NULL,
        published Int32,
        prompt Utf8,
        title Utf8,
        summary Utf8,
        surface_id Utf8,
        thumbnail_webp String,
        thumbnail_png String,
        thumbnail_width Int32,
        thumbnail_height Int32,
        thumbnail_generated_at_ms Uint64,
        thumbnail_error Utf8,
        thumbnail_attempted_at_ms Uint64,
        payload_json Utf8 NOT NULL,
        messages_json Utf8 NOT NULL,
        data_model_json Utf8 NOT NULL,
        created_at_ms Uint64 NOT NULL,
        PRIMARY KEY (feedback_id)
      )
    `;
    await ensurePublishedColumn(client);
    await ensureGallerySlugColumn(client);
    await ensureThumbnailColumns(client);
    await ensurePublishedDesignSlugTable(client);
    await backfillPublishedDesignSlugTableIfEmpty(client);
  })().catch((error: unknown) => {
    ensureTablePromise = undefined;
    throw error;
  });

  return ensureTablePromise;
}

async function getPublishedDesignBySlug(
  client: YdbFeedbackClient,
  slug: string,
) {
  const feedbackId = await getPublishedFeedbackIdBySlug(client, slug);

  if (!feedbackId) {
    return null;
  }

  return getPublishedDesignByFeedbackId(client, feedbackId);
}

async function getPublishedDesignByFeedbackId(
  client: YdbFeedbackClient,
  feedbackId: string,
) {
  const rows = await client.sql<[FeedbackRow]>`
    SELECT
      feedback_id,
      gallery_slug,
      prompt,
      title,
      summary,
      surface_id,
      thumbnail_width,
      thumbnail_height,
      thumbnail_generated_at_ms,
      payload_json,
      published,
      created_at_ms
    FROM ${client.sql.identifier(client.table)}
    WHERE feedback_id = ${new Utf8(feedbackId)} AND rating = 1 AND published = 1
    LIMIT ${new Uint64(BigInt(1))}
  `;

  return rowToPublishedDesign((rows[0] ?? [])[0] ?? null)[0] ?? null;
}

async function getPublishedFeedbackIdByDesignId(
  client: YdbFeedbackClient,
  id: string,
) {
  if (isPublishedDesignSlug(id)) {
    return getPublishedFeedbackIdBySlug(client, id);
  }

  const feedbackId = decodePublishedDesignId(id);

  if (!feedbackId) {
    return null;
  }

  const rows = await client.sql<[FeedbackRow]>`
    SELECT feedback_id
    FROM ${client.sql.identifier(client.table)}
    WHERE feedback_id = ${new Utf8(feedbackId)} AND rating = 1 AND published = 1
    LIMIT ${new Uint64(BigInt(1))}
  `;

  return readNonEmptyString((rows[0] ?? [])[0]?.feedback_id);
}

async function getPublishedFeedbackIdBySlug(
  client: YdbFeedbackClient,
  slug: string,
) {
  const rows = await client.sql<[FeedbackRow]>`
    SELECT feedback_id
    FROM ${client.sql.identifier(client.slugTable)}
    WHERE gallery_slug = ${new Utf8(slug)}
    LIMIT ${new Uint64(BigInt(1))}
  `;

  return readNonEmptyString((rows[0] ?? [])[0]?.feedback_id);
}

async function ensurePublishedDesignSlugTable(client: YdbFeedbackClient) {
  await client.sql`
    CREATE TABLE IF NOT EXISTS ${client.sql.identifier(client.slugTable)} (
      gallery_slug Utf8 NOT NULL,
      feedback_id Utf8 NOT NULL,
      created_at_ms Uint64 NOT NULL,
      PRIMARY KEY (gallery_slug)
    )
  `;
}

async function backfillPublishedDesignSlugTableIfEmpty(
  client: YdbFeedbackClient,
) {
  const rows = await client.sql<[FeedbackRow]>`
    SELECT gallery_slug
    FROM ${client.sql.identifier(client.slugTable)}
    LIMIT ${new Uint64(BigInt(1))}
  `;

  if ((rows[0] ?? []).length > 0) {
    return;
  }

  await backfillPublishedDesignSlugEntries(client, PUBLISHED_SLUG_BACKFILL_LIMIT);
}

async function backfillPublishedDesignSlugEntries(
  client: YdbFeedbackClient,
  limit: number,
) {
  const normalizedLimit = readBackfillLimit(limit);
  const rows = await client.sql<[FeedbackRow]>`
    SELECT feedback_id, gallery_slug, title, payload_json, published, created_at_ms
    FROM ${client.sql.identifier(client.table)}
    WHERE rating = 1 AND published = 1
    ORDER BY created_at_ms DESC
    LIMIT ${new Uint64(BigInt(normalizedLimit))}
  `;
  const entries = (rows[0] ?? []).flatMap(rowToPublishedDesignSlugEntry);

  for (
    let index = 0;
    index < entries.length;
    index += PUBLISHED_SLUG_UPSERT_CONCURRENCY
  ) {
    await Promise.all(
      entries
        .slice(index, index + PUBLISHED_SLUG_UPSERT_CONCURRENCY)
        .map((entry) => upsertPublishedDesignSlug(client, entry)),
    );
  }

  return {
    scanned: rows[0]?.length ?? 0,
    upserted: entries.length,
  };
}

async function upsertPublishedDesignSlug(
  client: YdbFeedbackClient,
  { createdAtMs, feedbackId, gallerySlug }: PublishedDesignSlugEntry,
) {
  await client.sql`
    UPSERT INTO ${client.sql.identifier(client.slugTable)}
      (gallery_slug, feedback_id, created_at_ms)
    VALUES
      (
        ${new Utf8(gallerySlug)},
        ${new Utf8(feedbackId)},
        ${new Uint64(BigInt(createdAtMs))}
      )
  `;
}

async function ensurePublishedColumn(client: YdbFeedbackClient) {
  try {
    await client.sql`
      SELECT published
      FROM ${client.sql.identifier(client.table)}
      LIMIT ${new Uint64(BigInt(1))}
    `;

    return;
  } catch (error) {
    if (!isMissingPublishedColumnError(error)) {
      throw error;
    }
  }

  try {
    await client.sql`
      ALTER TABLE ${client.sql.identifier(client.table)}
      ADD COLUMN published Int32
    `;
  } catch (error) {
    if (!isPublishedColumnExistsError(error)) {
      throw error;
    }
  }
}

async function ensureGallerySlugColumn(client: YdbFeedbackClient) {
  try {
    await client.sql`
      SELECT gallery_slug
      FROM ${client.sql.identifier(client.table)}
      LIMIT ${new Uint64(BigInt(1))}
    `;

    return;
  } catch (error) {
    if (!isMissingColumnError(error, "gallery_slug")) {
      throw error;
    }
  }

  try {
    await client.sql`
      ALTER TABLE ${client.sql.identifier(client.table)}
      ADD COLUMN gallery_slug Utf8
    `;
  } catch (error) {
    if (!isColumnExistsError(error, "gallery_slug")) {
      throw error;
    }
  }
}

async function ensureThumbnailColumns(client: YdbFeedbackClient) {
  const columns = [
    "thumbnail_webp",
    "thumbnail_png",
    "thumbnail_width",
    "thumbnail_height",
    "thumbnail_generated_at_ms",
    "thumbnail_error",
    "thumbnail_attempted_at_ms",
  ] as const;

  for (const column of columns) {
    await ensureThumbnailColumn(client, column);
  }
}

type ThumbnailColumnName =
  | "thumbnail_webp"
  | "thumbnail_png"
  | "thumbnail_width"
  | "thumbnail_height"
  | "thumbnail_generated_at_ms"
  | "thumbnail_error"
  | "thumbnail_attempted_at_ms";

async function ensureThumbnailColumn(
  client: YdbFeedbackClient,
  columnName: ThumbnailColumnName,
) {
  try {
    await client.sql`
      SELECT ${client.sql.identifier(columnName)}
      FROM ${client.sql.identifier(client.table)}
      LIMIT ${new Uint64(BigInt(1))}
    `;

    return;
  } catch (error) {
    if (!isMissingThumbnailColumnError(error, columnName)) {
      throw error;
    }
  }

  try {
    await addThumbnailColumn(client, columnName);
  } catch (error) {
    if (!isThumbnailColumnExistsError(error, columnName)) {
      throw error;
    }
  }
}

async function addThumbnailColumn(
  client: YdbFeedbackClient,
  columnName: ThumbnailColumnName,
) {
  switch (columnName) {
    case "thumbnail_webp":
      await client.sql`
        ALTER TABLE ${client.sql.identifier(client.table)}
        ADD COLUMN thumbnail_webp String
      `;
      return;
    case "thumbnail_png":
      await client.sql`
        ALTER TABLE ${client.sql.identifier(client.table)}
        ADD COLUMN thumbnail_png String
      `;
      return;
    case "thumbnail_width":
      await client.sql`
        ALTER TABLE ${client.sql.identifier(client.table)}
        ADD COLUMN thumbnail_width Int32
      `;
      return;
    case "thumbnail_height":
      await client.sql`
        ALTER TABLE ${client.sql.identifier(client.table)}
        ADD COLUMN thumbnail_height Int32
      `;
      return;
    case "thumbnail_generated_at_ms":
      await client.sql`
        ALTER TABLE ${client.sql.identifier(client.table)}
        ADD COLUMN thumbnail_generated_at_ms Uint64
      `;
      return;
    case "thumbnail_error":
      await client.sql`
        ALTER TABLE ${client.sql.identifier(client.table)}
        ADD COLUMN thumbnail_error Utf8
      `;
      return;
    case "thumbnail_attempted_at_ms":
      await client.sql`
        ALTER TABLE ${client.sql.identifier(client.table)}
        ADD COLUMN thumbnail_attempted_at_ms Uint64
      `;
      return;
  }
}

export function rowToPublishedDesign(row: FeedbackRow | null): PublishedDesign[] {
  if (!row?.feedback_id || !row.payload_json || !isPublished(row.published)) {
    return [];
  }

  let payload: unknown;

  try {
    payload = JSON.parse(row.payload_json);
  } catch {
    return [];
  }

  const parsed = composedInterfaceArgumentsSchema.safeParse(payload);

  if (!parsed.success) {
    return [];
  }

  const createdAtMs = readCreatedAtMs(row.created_at_ms);

  if (createdAtMs === null) {
    return [];
  }

  const prompt = readNonEmptyString(row.prompt);
  const title =
    readNonEmptyString(row.title) ?? getFeedbackPayloadTitle(parsed.data);
  const id =
    readPublishedSlug(row.gallery_slug) ??
    createPublishedDesignSlug(title, row.feedback_id);
  const thumbnail = readPublishedDesignThumbnail(row, id);

  return [
    {
      id,
      title,
      summary:
        readNonEmptyString(row.summary) ?? getFeedbackPayloadSummary(parsed.data),
      ...(prompt ? { prompt } : {}),
      payload: parsed.data,
      surfaceId: readNonEmptyString(row.surface_id) ?? parsed.data.surfaceId,
      createdAtMs,
      ...(thumbnail ? { thumbnail } : {}),
    },
  ];
}

export function rowToPublishedDesignSlugEntry(
  row: FeedbackRow | null,
): PublishedDesignSlugEntry[] {
  const feedbackId = readNonEmptyString(row?.feedback_id);
  const [design] = rowToPublishedDesign(row);

  if (!feedbackId || !design) {
    return [];
  }

  return [
    {
      gallerySlug: design.id,
      feedbackId,
      createdAtMs: design.createdAtMs,
    },
  ];
}

function rowToLikedExample(row: FeedbackRow): LikedDesignExample[] {
  if (!row.payload_json || !isPublished(row.published)) {
    return [];
  }

  let payload: unknown;

  try {
    payload = JSON.parse(row.payload_json);
  } catch {
    return [];
  }

  const parsed = composedInterfaceArgumentsSchema.safeParse(payload);

  if (!parsed.success) {
    return [];
  }

  return [
    {
      title: getFeedbackPayloadTitle(parsed.data),
      summary: getFeedbackPayloadSummary(parsed.data),
      ...(row.prompt ? { prompt: row.prompt } : {}),
      payload: parsed.data,
    },
  ];
}

function readNonEmptyString(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";

  return text || null;
}

function readPublishedSlug(value: unknown) {
  const slug = readNonEmptyString(value);

  return slug && isPublishedDesignSlug(slug) ? slug : null;
}

function readPublishedDesignThumbnail(row: FeedbackRow, id: string) {
  const width = readPositiveInteger(row.thumbnail_width);
  const height = readPositiveInteger(row.thumbnail_height);
  const generatedAtMs = readCreatedAtMs(row.thumbnail_generated_at_ms);

  if (width === null || height === null || generatedAtMs === null) {
    return null;
  }

  return {
    width,
    height,
    generatedAtMs,
    webpPath: `/gallery/${id}/thumbnail.webp`,
    pngPath: `/gallery/${id}/thumbnail.png`,
  };
}

function readPositiveInteger(value: unknown) {
  const parsed = readCreatedAtMs(value);

  return parsed !== null && Number.isInteger(parsed) && parsed > 0
    ? parsed
    : null;
}

function readBackfillLimit(value: unknown) {
  const limit = typeof value === "number" ? value : Number(value);

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > PUBLISHED_SLUG_BACKFILL_LIMIT
  ) {
    throw new Error(
      `Gallery slug backfill limit must be 1..${PUBLISHED_SLUG_BACKFILL_LIMIT}.`,
    );
  }

  return limit;
}

function readBytes(value: unknown) {
  if (value instanceof Uint8Array) {
    return Buffer.from(value);
  }

  if (typeof value === "string" && value.length > 0) {
    return Buffer.from(value, "binary");
  }

  return null;
}

function readCreatedAtMs(value: unknown) {
  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function isPublished(value: unknown) {
  return (
    value === true ||
    value === 1 ||
    (typeof value === "bigint" && value === BigInt(1)) ||
    value === "1"
  );
}

function isMissingPublishedColumnError(error: unknown) {
  return isMissingColumnError(error, "published");
}

function isPublishedColumnExistsError(error: unknown) {
  return isColumnExistsError(error, "published");
}

export function isMissingThumbnailColumnError(
  error: unknown,
  columnName: string,
) {
  return isMissingColumnError(error, columnName);
}

export function isThumbnailColumnExistsError(
  error: unknown,
  columnName: string,
) {
  return isColumnExistsError(error, columnName);
}

function isMissingColumnError(error: unknown, columnName: string) {
  const text = getErrorText(error).toLowerCase();
  const normalizedColumnName = columnName.toLowerCase();

  return (
    text.includes(normalizedColumnName) &&
    /(column|member|field|name|unknown|not found|not exist|cannot find|unresolved)/i.test(
      text,
    )
  );
}

function isColumnExistsError(error: unknown, columnName: string) {
  const text = getErrorText(error).toLowerCase();
  const normalizedColumnName = columnName.toLowerCase();

  return (
    text.includes(normalizedColumnName) &&
    /(already exists|duplicate|conflict)/i.test(text)
  );
}

function getErrorText(error: unknown) {
  return error instanceof Error
    ? `${error.name}: ${error.message}`
    : String(error);
}

function getConnectionString() {
  if (process.env.YDB_CONNECTION_STRING) {
    return process.env.YDB_CONNECTION_STRING;
  }

  const endpoint = process.env.YDB_ENDPOINT || "grpc://localhost:2136";
  const database = process.env.YDB_DATABASE || "/local";

  return `${endpoint.replace(/\/$/, "")}${database.startsWith("/") ? database : `/${database}`}`;
}

function getFeedbackTableName() {
  const table = process.env.YDB_FEEDBACK_TABLE || "design_feedback";

  if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(table)) {
    throw new Error("YDB_FEEDBACK_TABLE must be a simple table name.");
  }

  return table;
}

export function getGallerySlugTableName(feedbackTable = getFeedbackTableName()) {
  const table =
    process.env.YDB_GALLERY_SLUG_TABLE || `${feedbackTable}_gallery_slugs`;

  if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(table)) {
    throw new Error("YDB_GALLERY_SLUG_TABLE must be a simple table name.");
  }

  return table;
}

function applyYdbCredentialsEnv() {
  if (
    !process.env.YDB_STATIC_CREDENTIALS_ENDPOINT &&
    process.env.YDB_STATIC_CREDENTIALS_AUTH_ENDPOINT
  ) {
    process.env.YDB_STATIC_CREDENTIALS_ENDPOINT =
      process.env.YDB_STATIC_CREDENTIALS_AUTH_ENDPOINT;
  }

  if (
    process.env.YDB_STATIC_CREDENTIALS_PASSWORD ||
    !process.env.YDB_STATIC_CREDENTIALS_PASSWORD_FILE
  ) {
    return;
  }

  process.env.YDB_STATIC_CREDENTIALS_PASSWORD = readFileSync(
    process.env.YDB_STATIC_CREDENTIALS_PASSWORD_FILE,
    "utf8",
  ).trimEnd();
}
