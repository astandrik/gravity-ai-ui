import { Container } from "@/components/GravityUI/GravityUI";
import { withBasePath } from "@/lib/base-path";

import "./SiteHeader.scss";

const links = [
  { href: "/", label: "Generator" },
  { href: "/docs", label: "Docs" },
  { href: "/about", label: "About" },
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <Container maxWidth="xl" gutters={5} className="site-header__content">
        <a className="site-header__brand" href={withBasePath("/")}>
          <span className="site-header__name">Gravity AI UI</span>
          <span className="site-header__tag">A2UI shell</span>
        </a>
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
        </nav>
      </Container>
    </header>
  );
}
