type Level = "info" | "warn" | "error";

interface LogEntry {
  ts: string;
  level: Level;
  event: string;
  [key: string]: unknown;
}

function emit(level: Level, event: string, ctx: Record<string, unknown> = {}): void {
  const entry: LogEntry = { ts: new Date().toISOString(), level, event, ...ctx };
  const isDev = process.env.NODE_ENV === "development";
  const line = isDev
    ? `${entry.ts} [${level.toUpperCase().padEnd(5)}] ${event}${Object.keys(ctx).length ? " " + JSON.stringify(ctx) : ""}`
    : JSON.stringify(entry);
  (level === "error" ? process.stderr : process.stdout).write(line + "\n");
}

export const logger = {
  info:  (event: string, ctx?: Record<string, unknown>) => emit("info",  event, ctx),
  warn:  (event: string, ctx?: Record<string, unknown>) => emit("warn",  event, ctx),
  error: (event: string, ctx?: Record<string, unknown>) => emit("error", event, ctx),
};
