import { Container, Text } from "@/components/GravityUI/GravityUI";

import "./page.scss";

const commands = [
  "npm run dev -- --port 3000",
  "npm run lint",
  "npm test",
  "npm run typecheck",
  "npm run build",
] as const;

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
        </section>
      </Container>
    </main>
  );
}
