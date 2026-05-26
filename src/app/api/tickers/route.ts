import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

const SYMBOLS = ["AAPL","MSFT","TSLA","NVDA","GOOGL","META","AMZN","JPM","AMD","SPY","QQQ","GLD"];

export const dynamic = "force-dynamic";

export async function GET() {
  const token = process.env.FINNHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ live: false, reason: "no_token" }, { status: 503 });
  }

  try {
    const results = await Promise.all(
      SYMBOLS.map(async (symbol) => {
        const res = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${token}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`${symbol}: ${res.status}`);
        const data = await res.json() as { c: number; dp: number | null };
        const change = data.dp ?? 0;
        const price  = data.c ?? 0;
        return {
          s: symbol,
          p: price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          c: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
          up: change >= 0,
        };
      })
    );
    return NextResponse.json({ live: true, tickers: results });
  } catch (err) {
    logger.error("TICKERS_FETCH_ERROR", { errorName: err instanceof Error ? err.name : "UnknownError" });
    return NextResponse.json({ live: false, reason: "fetch_error" }, { status: 500 });
  }
}
