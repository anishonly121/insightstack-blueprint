import { test } from "node:test";
import assert from "node:assert/strict";
import { detectDateOrder, parseAmount, parseDate, parseTransactionsCsv } from "../../src/lib/csv";

const iso = (d: Date | null) => d?.toISOString().slice(0, 10) ?? null;

test("parseDate handles ISO, day-first, month-first and month names", () => {
  assert.equal(iso(parseDate("2026-02-13")), "2026-02-13");
  assert.equal(iso(parseDate("2026-02-13T10:00:00Z")), "2026-02-13");
  assert.equal(iso(parseDate("13/02/2026", "DMY")), "2026-02-13");
  assert.equal(iso(parseDate("02/13/2026", "MDY")), "2026-02-13");
  assert.equal(iso(parseDate("13-02-26", "DMY")), "2026-02-13");
  assert.equal(iso(parseDate("13 Feb 2026")), "2026-02-13");
  assert.equal(iso(parseDate("13 September 2026")), "2026-09-13");
  assert.equal(iso(parseDate("Feb 13, 2026")), "2026-02-13");
});

test("parseDate rejects impossible or unreadable dates", () => {
  assert.equal(parseDate("31/02/2026", "DMY"), null);
  assert.equal(parseDate("not a date"), null);
  assert.equal(parseDate(""), null);
});

test("detectDateOrder looks for an unambiguous value", () => {
  assert.equal(detectDateOrder(["01/02/2026", "13/02/2026"]), "DMY");
  assert.equal(detectDateOrder(["01/02/2026", "02/13/2026"]), "MDY");
  assert.equal(detectDateOrder(["01/02/2026", "03/04/2026"]), "DMY");
  assert.equal(detectDateOrder(["2026-01-02"]), "DMY");
});

test("parseAmount reads common money formats", () => {
  assert.equal(parseAmount("1,234.50"), 1234.5);
  assert.equal(parseAmount("-12"), -12);
  assert.equal(parseAmount("$-12.30"), -12.3);
  assert.equal(parseAmount("S$ 12.00"), 12);
  assert.equal(parseAmount("(12.50)"), -12.5);
  assert.equal(parseAmount("12.50 DR"), -12.5);
  assert.equal(parseAmount("12.50 CR"), 12.5);
  assert.equal(parseAmount("12.50-"), -12.5);
  assert.equal(parseAmount("abc"), null);
  assert.equal(parseAmount(""), null);
});

test("headers are matched regardless of case and common names", () => {
  const result = parseTransactionsCsv("Transaction Date,Merchant,Category,Amount\n13/02/2026,Kopi,Food,-3.50\n");
  assert.ok(result.ok);
  assert.equal(result.rows.length, 1);
  assert.deepEqual(
    { ...result.rows[0], date: iso(result.rows[0]!.date) },
    { date: "2026-02-13", description: "Kopi", category: "Food", amount: "-3.50" },
  );
});

test("debit and credit columns become a signed amount", () => {
  const csv = "Date,Description,Debit,Credit\n2026-03-01,Salary,,4000\n2026-03-02,NTUC,85.20,\n";
  const result = parseTransactionsCsv(csv);
  assert.ok(result.ok);
  assert.deepEqual(result.rows.map((r) => r.amount), ["4000.00", "-85.20"]);
  assert.deepEqual(result.rows.map((r) => r.category), ["Uncategorized", "Uncategorized"]);
});

test("bad rows are skipped and counted, not dropped silently", () => {
  const csv = "date,description,category,amount\n2026-01-01,A,Food,-5\nnot-a-date,B,Food,-5\n2026-01-03,C,Food,oops\n";
  const result = parseTransactionsCsv(csv);
  assert.ok(result.ok);
  assert.equal(result.rows.length, 1);
  assert.equal(result.skippedRows, 2);
  assert.equal(result.totalRows, 3);
});

test("a byte order mark on the first header is ignored", () => {
  const result = parseTransactionsCsv("﻿Date,Description,Category,Amount\n2026-01-01,A,Food,-5\n");
  assert.ok(result.ok);
  assert.equal(result.rows.length, 1);
});

test("missing required columns produce a clear message", () => {
  const result = parseTransactionsCsv("when,what\n2026-01-01,A\n");
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, "MISSING_COLUMNS");
    assert.match(result.message, /date/);
    assert.match(result.message, /amount/);
    assert.match(result.message, /when, what/);
  }
});

test("an empty file is rejected", () => {
  const result = parseTransactionsCsv("");
  assert.equal(result.ok, false);
});
