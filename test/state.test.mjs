import test from "node:test";
import assert from "node:assert/strict";
import { clampDays, escapeHtml, parseState } from "../src/state.mjs";

test("broken saved data falls back to an empty board", () => {
  for (const raw of [null, "", "{", "null", "[]", "5", '"x"']) assert.deepEqual(parseState(raw), {});
});

test("valid saved data is kept, bad entries dropped", () => {
  const out = parseState(JSON.stringify({ zekkyu: { choice: "todo" }, fragments: { choice: "todo", days: 99 }, bad: null, odd: { choice: "x" } }));
  assert.deepEqual(out, { zekkyu: { choice: "todo" }, fragments: { choice: "todo", days: 31 }, odd: {} });
});

test("days are clamped to 0..31", () => {
  assert.equal(clampDays(-3), 0);
  assert.equal(clampDays("4.7"), 4);
  assert.equal(clampDays("abc"), 0);
});

test("html is escaped", () => {
  assert.equal(escapeHtml(`<a href="x">&'`), "&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
});
