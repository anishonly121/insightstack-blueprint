import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt =
  "InsightStack: your money, a clearer perspective. Built by Anish Bhole.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#fafbf9",
          padding: "66px",
          fontFamily: "sans-serif",
          color: "#202c36",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: "68%" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: -1,
            }}
          >
            <div
              style={{
                width: 31,
                height: 31,
                background: "#365be8",
                borderRadius: 8,
                marginRight: 10,
              }}
            />
            insightstack.
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 75,
              fontSize: 65,
              letterSpacing: -3,
              lineHeight: 1.08,
            }}
          >
            <span>Your money.</span>
            <span>A clearer</span>
            <span style={{ color: "#365be8" }}>perspective.</span>
          </div>
          <div style={{ fontSize: 20, color: "#758276", marginTop: 30 }}>
            From transaction rows to your next decision.
          </div>
          <div style={{ fontSize: 14, color: "#7a8b80", marginTop: "auto" }}>
            An independent project by Anish Bhole
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "#1d2c37",
            borderRadius: 18,
            padding: 30,
            width: "32%",
            marginTop: 18,
            marginBottom: 18,
            color: "#e7eef3",
          }}
        >
          <div style={{ fontSize: 13, color: "#94afa1", letterSpacing: 2 }}>
            EXPLORE INSIGHTSTACK
          </div>
          <div style={{ fontSize: 30, marginTop: 30, lineHeight: 1.2 }}>
            A financial workspace, in focus.
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 13,
              height: 135,
              marginTop: 35,
            }}
          >
            {[56, 82, 68, 116, 95, 128].map((height, index) => (
              <div
                key={index}
                style={{
                  width: 25,
                  height,
                  borderRadius: 5,
                  background: index === 5 ? "#b9d6c3" : "#5978e0",
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 15, color: "#a7bac8", marginTop: "auto" }}>
            Interactive demo. No sign-up.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
