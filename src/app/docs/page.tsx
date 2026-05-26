import { Container, Text } from "@/components/GravityUI/GravityUI";

import "./page.scss";

const commands = [
  "npm run dev -- --port 3000",
  "npm run lint",
  "npm test",
  "npm run typecheck",
  "npm run build",
] as const;

const mcpTools = [
  "search_interfaces",
  "get_interface",
  "generate_interface",
  "refine_interface",
] as const;

const mcpUrl = "https://gravity-ai.ydb-qdrant.tech/mcp";
const mcpCommand = `codex mcp add gravityAiUi --url ${mcpUrl}`;

export default function DocsPage() {
  return (
    <main className="page-shell">
      <Container maxWidth="xl" gutters={5}>
        <section className="docs-page" aria-labelledby="docs-title">
          <Text as="h1" id="docs-title" variant="display-2">
            Project Commands
          </Text>
          <Text
            as="p"
            variant="body-2"
            color="secondary"
            className="docs-page__lead"
          >
            Baseline commands for local development and verification.
          </Text>
          <div className="docs-page__commands">
            {commands.map((command) => (
              <code key={command}>{command}</code>
            ))}
          </div>

          <section className="docs-page__section" aria-labelledby="mcp-title">
            <Text as="h2" id="mcp-title" variant="subheader-3">
              Remote MCP
            </Text>
            <Text
              as="p"
              variant="body-2"
              color="secondary"
              className="docs-page__section-copy"
            >
              Connect coding agents to public gallery lookup and interface
              generation. Generated MCP results are returned to the caller only;
              they are not saved or published.
            </Text>
            <div className="docs-page__commands">
              <code>{mcpUrl}</code>
              <code>{mcpCommand}</code>
            </div>
            <div className="docs-page__tools" aria-label="MCP tools">
              {mcpTools.map((tool) => (
                <code key={tool}>{tool}</code>
              ))}
            </div>
          </section>
        </section>
      </Container>
    </main>
  );
}
