import { LogoGithub } from "@gravity-ui/icons";
import { Container } from "@/components/GravityUI/GravityUI";
import { AskAIPanel } from "@/components/AskAI/AskAIPanel";
import {
  ASK_AI_PRODUCT_EVALUATION,
  ASK_AI_PRODUCT_NAME,
} from "@/components/AskAI/ask-ai-content";
import { withBasePath } from "@/lib/base-path";

import "./SiteHeader.scss";

const links = [
  { href: "/", label: "Generator" },
  { href: "/gallery", label: "Gallery" },
  { href: "/docs", label: "Docs" },
  { href: "/about", label: "About" },
] as const;
const GITHUB_REPOSITORY_URL = "https://github.com/astandrik/gravity-ai-ui";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Container maxWidth="xl" gutters={5} className="site-header__content">
        <a className="site-header__brand" href={withBasePath("/")}>
          <span className="site-header__name">Gravity AI UI</span>
          <span className="site-header__tag">A2UI shell</span>
        </a>
        <div className="site-header__ask-ai">
          <AskAIPanel
            minimal
            productName={ASK_AI_PRODUCT_NAME}
            label="Ask AI"
            helperText={ASK_AI_PRODUCT_EVALUATION.helperText}
            prompt={ASK_AI_PRODUCT_EVALUATION.prompt}
            page="header"
            promptVariant={ASK_AI_PRODUCT_EVALUATION.promptVariant}
          />
        </div>
        <nav className="site-header__nav" aria-label="Primary navigation">
          {links.map((link) => (
            <a
              key={link.href}
              className="site-header__link"
              href={withBasePath(link.href)}
            >
              {link.label}
            </a>
          ))}
          <a
            aria-label="Open GitHub repository"
            className="site-header__link site-header__link_icon"
            href={GITHUB_REPOSITORY_URL}
            rel="noopener noreferrer"
            target="_blank"
            title="GitHub repository"
          >
            <LogoGithub aria-hidden="true" width={16} height={16} />
          </a>
        </nav>
      </Container>
    </header>
  );
}
