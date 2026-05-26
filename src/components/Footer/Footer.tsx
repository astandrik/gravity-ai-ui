import Image from "next/image";
import { Container, Text } from "@/components/GravityUI/GravityUI";
import { withBasePath } from "@/lib/base-path";

import "./Footer.scss";

const GRAVITY_UI_URL = "https://github.com/gravity-ui/uikit";
const YDB_URL = "https://ydb.tech/";
const A2UI_URL = "https://a2ui.org/";
const OPENAPI_URL = "/openapi.json";
const MCP_DOCS_URL = "/mcp.md";

export function Footer() {
  return (
    <Container as="footer" maxWidth="xl" gutters={5} className="footer">
      <div className="footer__content">
        <Text variant="caption-2" color="secondary" className="footer__note">
          Agent-generated interfaces rendered with trusted local components.
        </Text>
        <div className="footer__credits" aria-label="Technology credits">
          <FooterCredit label="API spec" href={OPENAPI_URL}>
            <span>OpenAPI</span>
          </FooterCredit>
          <FooterCredit label="Agent docs" href={MCP_DOCS_URL}>
            <span>MCP</span>
          </FooterCredit>
          <FooterCredit label="Interface protocol" href={A2UI_URL}>
            <Image
              src={withBasePath("/assets/a2ui-logo.svg")}
              alt=""
              width={18}
              height={18}
              className="footer__icon footer__icon_a2ui"
              unoptimized
            />
            <span>A2UI</span>
          </FooterCredit>
          <FooterCredit label="Built with" href={GRAVITY_UI_URL}>
            <span>gravity-ui/uikit</span>
            <Image
              src={withBasePath("/assets/gravity-ui-favicon.png")}
              alt=""
              width={18}
              height={18}
              className="footer__icon"
              unoptimized
            />
          </FooterCredit>
          <FooterCredit label="Data layer" href={YDB_URL}>
            <Image
              src={withBasePath("/assets/ydb-icon.svg")}
              alt=""
              width={22}
              height={18}
              className="footer__icon footer__icon_ydb"
              unoptimized
            />
            <span>YDB</span>
          </FooterCredit>
        </div>
      </div>
    </Container>
  );
}

function FooterCredit({
  children,
  href,
  label,
}: {
  children: React.ReactNode;
  href: string;
  label: string;
}) {
  const isExternal = href.startsWith("http");

  return (
    <span className="footer__credit">
      <span className="footer__credit-label">{label}</span>
      <a
        href={isExternal ? href : withBasePath(href)}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="footer__link"
      >
        {children}
      </a>
    </span>
  );
}
