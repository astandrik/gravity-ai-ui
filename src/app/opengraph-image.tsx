import { ImageResponse } from "next/og";

import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_STACK,
  SITE_TAGLINE,
  SOCIAL_IMAGE,
} from "@/lib/site";

export const alt = SOCIAL_IMAGE.alt;
export const size = {
  width: SOCIAL_IMAGE.width,
  height: SOCIAL_IMAGE.height,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#111418",
          color: "#f8fafc",
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "linear-gradient(135deg, #111418 0%, #1b222c 52%, #17231b 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "44px 56px",
            display: "flex",
            border: "1px solid rgba(255, 255, 255, 0.16)",
            borderRadius: 34,
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: 710,
            paddingLeft: 82,
            gap: 26,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 412,
              padding: "12px 18px",
              borderRadius: 999,
              background: "rgba(255, 190, 92, 0.16)",
              color: "#ffca78",
              fontSize: 29,
              fontWeight: 700,
            }}
          >
            AI-agent UI shell
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                fontSize: 88,
                lineHeight: 0.95,
                fontWeight: 800,
                letterSpacing: 0,
              }}
            >
              {SITE_NAME}
            </div>
            <div
              style={{
                color: "#ffbe5c",
                fontSize: 45,
                lineHeight: 1.1,
                fontWeight: 700,
                letterSpacing: 0,
              }}
            >
              {SITE_TAGLINE}
            </div>
          </div>
          <div
            style={{
              color: "#cbd3df",
              fontSize: 30,
              lineHeight: 1.35,
              width: 650,
            }}
          >
            {SITE_DESCRIPTION}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 82,
            top: 88,
            width: 374,
            height: 454,
            display: "flex",
            flexDirection: "column",
            borderRadius: 28,
            background: "#171a20",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            boxShadow: "0 32px 90px rgba(0, 0, 0, 0.36)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              height: 72,
              alignItems: "center",
              padding: "0 24px",
              gap: 10,
              borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: "#ffbe5c",
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: "#72d188",
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: "#72a7ff",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: 24,
              gap: 18,
            }}
          >
            {SITE_STACK.slice(1, 6).map((item, index) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 18px",
                  borderRadius: 18,
                  background:
                    index === 0 ? "rgba(255, 190, 92, 0.16)" : "#22262f",
                  color: index === 0 ? "#ffca78" : "#e7ebf0",
                  fontSize: 26,
                  fontWeight: 700,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 34,
                    borderRadius: 999,
                    background: index === 0 ? "#ffbe5c" : "#566071",
                  }}
                />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
