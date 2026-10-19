import Papa from "papaparse";

/**
 * Turns an uploaded bank or budgeting CSV into clean transaction rows.
 *
 * It is forgiving about the things real exports get "wrong":
 *   - header names in any case, with common alternatives ("Transaction Date", "Merchant", "Value")
 *   - separate Debit / Credit columns instead of one signed Amount column
 *   - DD/MM/YYYY, MM/DD/YYYY, ISO and "13 Feb 2026" style dates
 *   - currency symbols, thousands separators, "(12.50)" and "12.50 DR" negatives
 *   - a missing category (filled in as "Uncategorized")
 *
 * Rows that still can't be read are skipped and counted, never silently invented.
 */

export type ParsedTransaction = {
  date: Date;
  description: string;
  category: string;
  /** Signed amount with two decimals. Negative is money out. */
  amount: string;
};

export type DateOrder = "DMY" | "MDY";

export type CsvParseResult =
  | {
      ok: true;
      rows: ParsedTransaction[];
      skippedRows: number;
      totalRows: number;
      dateOrder: DateOrder;
      preview: Record<string, string>[];
    }
  | {
      ok: false;
      code: "EMPTY_FILE" | "MISSING_COLUMNS";
      message: string;
    };

const HEADER_ALIASES = {
  date: ["date", "transaction date", "txn date", "posted date", "posting date", "value date", "booking date"],
  description: ["description", "details", "merchant", "narrative", "payee", "memo", "transaction description", "reference", "name"],
  category: ["category", "categories"],
  amount: ["amount", "value", "amt", "transaction amount", "sgd amount", "amount (sgd)"],
  debit: ["debit", "debit amount", "withdrawal", "withdrawals", "withdrawal amount", "money out", "paid out"],
  credit: ["credit", "credit amount", "deposit", "deposits", "deposit amount", "money in", "paid in"],
} as const;

type Field = keyof typeof HEADER_ALIASES;

const normalizeHeader = (header: string): string =>
  header.replace(/^﻿/, "").trim().toLowerCase().replace(/[_\s]+/g, " ");

export function mapHeaders(headers: string[]): Partial<Record<Field, string>> {
  const mapping: Partial<Record<Field, string>> = {};
  const normalized = headers.map((h) => ({ raw: h, norm: normalizeHeader(h) }));
  for (const field of Object.keys(HEADER_ALIASES) as Field[]) {
    for (const alias of HEADER_ALIASES[field]) {
      const match = normalized.find((h) => h.norm === alias);
      if (match) {
        mapping[field] = match.raw;
        break;
      }
    }
  }
  return mapping;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

const utcDate = (year: number, month: number, day: number): Date | null => {
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  // Reject impossible dates such as 31/02 that JS would roll into March.
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
};

const NUMERIC_DATE = /^(\d{1,4})[/.-](\d{1,2})[/.-](\d{1,4})(?:[ T].*)?$/;
const DAY_MONTH_NAME = /^(\d{1,2})[\s-]+([a-z]{3,9})[\s,-]+(\d{2,4})$/i;
const MONTH_NAME_DAY = /^([a-z]{3,9})[\s-]+(\d{1,2}),?[\s-]+(\d{2,4})$/i;

/**
 * Decide whether slash dates in this file are day-first or month-first by
 * looking for a value that can only be one or the other (a "day" above 12).
 * When every date is ambiguous we assume day-first, as used in Singapore.
 */
export function detectDateOrder(values: string[]): DateOrder {
  for (const value of values) {
    const m = NUMERIC_DATE.exec(value.trim());
    if (!m || m[1]!.length === 4) continue;
    const first = Number(m[1]);
    const second = Number(m[2]);
    if (first > 12 && second <= 12) return "DMY";
    if (second > 12 && first <= 12) return "MDY";
  }
  return "DMY";
}

export function parseDate(value: string, order: DateOrder = "DMY"): Date | null {
  const raw = value.trim();
  if (!raw) return null;

  const numeric = NUMERIC_DATE.exec(raw);
  if (numeric) {
    const [a, b, c] = [numeric[1]!, numeric[2]!, numeric[3]!];
    if (a.length === 4) return utcDate(Number(a), Number(b), Number(c)); // YYYY-MM-DD
    if (c.length !== 4 && c.length !== 2) return null;
    return order === "DMY"
      ? utcDate(Number(c), Number(b), Number(a))
      : utcDate(Number(c), Number(a), Number(b));
  }

  const dmy = DAY_MONTH_NAME.exec(raw);
  if (dmy) {
    const month = MONTHS[dmy[2]!.slice(0, 4).toLowerCase()] ?? MONTHS[dmy[2]!.slice(0, 3).toLowerCase()];
    return month ? utcDate(Number(dmy[3]), month, Number(dmy[1])) : null;
  }

  const mdy = MONTH_NAME_DAY.exec(raw);
  if (mdy) {
    const month = MONTHS[mdy[1]!.slice(0, 4).toLowerCase()] ?? MONTHS[mdy[1]!.slice(0, 3).toLowerCase()];
    return month ? utcDate(Number(mdy[3]), month, Number(mdy[2])) : null;
  }

  return null;
}

/** Parse "1,234.50", "$-12", "S$ 12.00", "(12.50)", "12.50 DR". Returns null when unreadable. */
export function parseAmount(value: string): number | null {
  let raw = value.trim();
  if (!raw) return null;

  let negative = false;
  const suffix = /\s*(cr|dr)\.?$/i.exec(raw);
  if (suffix) {
    negative = suffix[1]!.toLowerCase() === "dr";
    raw = raw.slice(0, suffix.index);
  }
  if (/^\(.*\)$/.test(raw)) {
    negative = true;
    raw = raw.slice(1, -1);
  }

  raw = raw.replace(/(sgd|usd|s\$|us\$|\$|€|£)/gi, "").replace(/[,\s]/g, "");
  if (raw.endsWith("-")) {
    negative = !negative;
    raw = raw.slice(0, -1);
  }
  if (!/^[-+]?\d*\.?\d+$/.test(raw)) return null;

  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return negative ? -Math.abs(n) : n;
}

const cell = (row: Record<string, unknown>, header: string | undefined): string => {
  if (!header) return "";
  const v = row[header];
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
};

export function parseTransactionsCsv(text: string, previewSize = 20): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    dynamicTyping: false,
  });

  const headers = (parsed.meta.fields ?? []).filter((h) => h.trim().length > 0);
  const data = parsed.data.filter((row) => row && typeof row === "object");

  if (headers.length === 0 || data.length === 0) {
    return { ok: false, code: "EMPTY_FILE", message: "The file has no rows to import." };
  }

  const map = mapHeaders(headers);
  const hasAmount = Boolean(map.amount) || Boolean(map.debit) || Boolean(map.credit);
  const missing: string[] = [];
  if (!map.date) missing.push("date");
  if (!hasAmount) missing.push("amount (or debit/credit)");
  if (missing.length > 0) {
    return {
      ok: false,
      code: "MISSING_COLUMNS",
      message: `Couldn't find a ${missing.join(" or ")} column. Columns found: ${headers.join(", ")}.`,
    };
  }

  const dateOrder = detectDateOrder(data.map((row) => cell(row, map.date)));
  const rows: ParsedTransaction[] = [];
  let skippedRows = 0;

  for (const row of data) {
    const date = parseDate(cell(row, map.date), dateOrder);

    let amount: number | null = null;
    if (map.amount && cell(row, map.amount)) {
      amount = parseAmount(cell(row, map.amount));
    } else if (map.debit || map.credit) {
      const debit = map.debit ? parseAmount(cell(row, map.debit)) : null;
      const credit = map.credit ? parseAmount(cell(row, map.credit)) : null;
      if (debit !== null || credit !== null) {
        amount = (credit !== null ? Math.abs(credit) : 0) - (debit !== null ? Math.abs(debit) : 0);
      }
    }

    if (!date || amount === null) {
      skippedRows += 1;
      continue;
    }

    rows.push({
      date,
      description: (cell(row, map.description) || "(no description)").slice(0, 500),
      category: (cell(row, map.category) || "Uncategorized").slice(0, 100),
      amount: amount.toFixed(2),
    });
  }

  const preview = data.slice(0, previewSize).map((row) => {
    const out: Record<string, string> = {};
    for (const h of headers) out[h] = cell(row, h);
    return out;
  });

  return { ok: true, rows, skippedRows, totalRows: data.length, dateOrder, preview };
}
