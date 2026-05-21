import { EnvironCredentialsProvider } from "@ydbjs/auth/environ";
import { Driver } from "@ydbjs/core";
import { query, type QueryClient } from "@ydbjs/query";
import { Int32, Utf8, Uint64 } from "@ydbjs/value/primitive";
import { readFileSync } from "node:fs";
import type {
  DesignFeedbackInput,
  LikedDesignExample,
  SavedDesignFeedback,
} from "./designFeedback";
import { toSavedFeedback } from "./designFeedback";
import { renderInterfaceArgumentsSchema } from "@/lib/agent/fixedInterface";

type YdbFeedbackClient = {
  driver: Driver;
  sql: QueryClient;
  ready: Promise<void>;
  table: string;
};

type FeedbackRow = {
  prompt?: string | null;
  payload_json?: string | null;
};

let clientPromise: Promise<YdbFeedbackClient> | undefined;
let ensureTablePromise: Promise<void> | undefined;

export async function saveDesignFeedback(
  input: DesignFeedbackInput,
): Promise<SavedDesignFeedback> {
  const saved = toSavedFeedback(input);
  const client = await getClient();

  await ensureFeedbackTable(client);

  await client.sql`
    UPSERT INTO ${client.sql.identifier(client.table)}
      (
        feedback_id,
        conversation_id,
        turn_id,
        rating,
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
        ${new Utf8(saved.conversationId)},
        ${new Utf8(saved.turnId)},
        ${new Int32(saved.rating)},
        ${new Utf8(saved.prompt ?? "")},
        ${new Utf8(saved.payload.title)},
        ${new Utf8(saved.payload.summary)},
        ${new Utf8(saved.payload.surfaceId)},
        ${new Utf8(JSON.stringify(saved.payload))},
        ${new Utf8(JSON.stringify(saved.messages))},
        ${new Utf8(JSON.stringify(saved.dataModel ?? null))},
        ${new Uint64(BigInt(saved.createdAtMs))}
      )
  `;

  return saved;
}

export async function listLikedDesignExamples(limit = 3) {
  const client = await getClient();

  await ensureFeedbackTable(client);

  const rows = await client.sql<[FeedbackRow]>`
    SELECT prompt, payload_json
    FROM ${client.sql.identifier(client.table)}
    WHERE rating = 1
    ORDER BY created_at_ms DESC
    LIMIT ${new Uint64(BigInt(limit))}
  `;

  return rows[0].flatMap(rowToLikedExample);
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

  const client = {
    driver,
    sql: query(driver, { poolOptions: { maxSize: 4 } }),
    ready: driver.ready(),
    table: getFeedbackTableName(),
  };

  await client.ready;

  return client;
}

async function ensureFeedbackTable(client: YdbFeedbackClient) {
  ensureTablePromise ??= client.sql`
    CREATE TABLE IF NOT EXISTS ${client.sql.identifier(client.table)} (
      feedback_id Utf8 NOT NULL,
      conversation_id Utf8 NOT NULL,
      turn_id Utf8 NOT NULL,
      rating Int32 NOT NULL,
      prompt Utf8,
      title Utf8,
      summary Utf8,
      surface_id Utf8,
      payload_json Utf8 NOT NULL,
      messages_json Utf8 NOT NULL,
      data_model_json Utf8 NOT NULL,
      created_at_ms Uint64 NOT NULL,
      PRIMARY KEY (feedback_id)
    )
  `.then(() => undefined);

  return ensureTablePromise;
}

function rowToLikedExample(row: FeedbackRow): LikedDesignExample[] {
  if (!row.payload_json) {
    return [];
  }

  let payload: unknown;

  try {
    payload = JSON.parse(row.payload_json);
  } catch {
    return [];
  }

  const parsed = renderInterfaceArgumentsSchema.safeParse(payload);

  if (!parsed.success) {
    return [];
  }

  return [
    {
      title: parsed.data.title,
      summary: parsed.data.summary,
      ...(row.prompt ? { prompt: row.prompt } : {}),
      payload: parsed.data,
    },
  ];
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
