import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "InsightStack — AI-Powered Finance Analytics";
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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#050B18",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glows */}
        <div style={{ position: "absolute", top: -240, left: -180, width: 900, height: 900, background: "radial-gradient(ellipse, rgba(59,130,246,0.16) 0%, transparent 65%)", filter: "blur(72px)" }} />
        <div style={{ position: "absolute", bottom: -200, right: -120, width: 700, height: 700, background: "radial-gradient(ellipse, rgba(99,102,241,0.10) 0%, transparent 65%)", filter: "blur(72px)" }} />

        {/* Dot grid overlay */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "32px 32px", opacity: 0.6 }} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 80px", position: "relative" }}>

          {/* Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 999, padding: "6px 18px", marginBottom: 36 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#60A5FA" }} />
            <span style={{ color: "#93C5FD", fontSize: 13, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" }}>AI-Powered Finance Analytics</span>
          </div>

          {/* Logo + wordmark */}
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 36 }}>
            {/* Logo mark using CSS bars */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 52 }}>
              <div style={{ width: 12, height: 20, background: "rgba(59,130,246,0.32)", borderRadius: 4 }} />
              <div style={{ width: 12, height: 34, background: "rgba(59,130,246,0.62)", borderRadius: 4 }} />
              <div style={{ width: 12, height: 52, background: "#3B82F6", borderRadius: 4 }} />
            </div>
            <span style={{ fontSize: 58, fontWeight: 900, color: "white", letterSpacing: "-0.025em", lineHeight: 1 }}>
              Insight<span style={{ color: "#60A5FA" }}>Stack</span>
            </span>
          </div>

          {/* Headline */}
          <div style={{ fontSize: 62, fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.025em", color: "white", marginBottom: 24, maxWidth: 900 }}>
            Know exactly where every dollar goes.
          </div>

          {/* Subtitle */}
          <div style={{ fontSize: 22, color: "#8892A4", lineHeight: 1.5, marginBottom: 52 }}>
            Upload any bank CSV · Map spend · Get GPT-4o recommendations in 60 seconds
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { val: "87%", label: "less time on reviews" },
              { val: "60s",  label: "CSV to AI insight"    },
              { val: "GPT-4o", label: "AI engine"          },
              { val: "100%", label: "TypeScript"           },
            ].map((s) => (
              <div
                key={s.val}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  padding: "16px 28px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 30, fontWeight: 900, color: "#60A5FA", lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 13, color: "#8892A4", marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
