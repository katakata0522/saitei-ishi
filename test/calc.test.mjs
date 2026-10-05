import test from "node:test";
import assert from "node:assert/strict";
import { ROWS } from "../src/data.mjs";
import { contribution, summarize, totals } from "../src/calc.mjs";

const at = (iso) => new Date(iso);
const row = (id) => ROWS.find((item) => item.id === id);

test("on 2026-10-05 the untouched board counts only the quest-search orb", () => {
  const summary = summarize(ROWS, {}, at("2026-10-05T15:00:00+09:00"));
  assert.deepEqual(totals(summary), { minimum: 1, withConditions: 1, withEstimate: 1 });
});

test("a tournament win the player can still do adds 30 to the minimum", () => {
  const summary = summarize(
    ROWS,
    { zekkyu: { choice: "todo" } },
    at("2026-10-05T15:00:00+09:00"),
  );
  assert.equal(totals(summary).minimum, 31);
});

test("an already cleared collab and a skipped tournament stay out", () => {
  const summary = summarize(
    ROWS,
    {
      "rezero-five": { choice: "done" },
      zekkyu: { choice: "skip" },
    },
    at("2026-10-05T15:00:00+09:00"),
  );
  assert.equal(totals(summary).minimum, 1);
});

test("the tournament leaves the minimum after 10-06 11:59", () => {
  const part = contribution(row("zekkyu"), { choice: "todo" }, at("2026-10-06T12:00:00+09:00"));
  assert.equal(part.minimum, 0);
  assert.equal(part.closed, true);
});

test("quest search leaves after 10-10 3:59", () => {
  const summary = summarize(ROWS, {}, at("2026-10-10T04:00:00+09:00"));
  assert.equal(totals(summary).minimum, 0);
});

test("fragment stock is conditional and never raises the minimum", () => {
  const summary = summarize(
    ROWS,
    { fragments: { choice: "todo", days: 4 } },
    at("2026-10-05T15:00:00+09:00"),
  );
  const view = totals(summary);
  assert.equal(view.minimum, 1);
  assert.equal(view.withConditions, 5);
});

test("the prison total stays an estimate until the player accepts it", () => {
  const off = summarize(ROWS, {}, at("2026-10-05T15:00:00+09:00"));
  const on = summarize(ROWS, { kinki: { choice: "todo" } }, at("2026-10-05T15:00:00+09:00"));
  assert.equal(totals(off).withEstimate, 1);
  assert.equal(totals(on).minimum, 1);
  assert.equal(totals(on).withEstimate, 56);
});

test("the tower reference never enters a total", () => {
  const part = contribution(row("tower"), { choice: "todo" }, at("2026-10-07T12:00:00+09:00"));
  assert.equal(part.minimum + part.conditional + part.estimate, 0);
});
