import assert from "node:assert/strict";
import { test } from "node:test";
import { formatDue } from "../src/due.js";

const today = new Date(2026, 9, 15);

test("says when a task is due", () => {
  assert.equal(formatDue(new Date(2026, 9, 15), today), "Today");
  assert.equal(formatDue(new Date(2026, 9, 16), today), "Tomorrow");
  assert.equal(formatDue(new Date(2026, 9, 13), today), "Overdue · Oct 13");
  assert.equal(formatDue(new Date(2026, 9, 30), today), "Oct 30");
  assert.equal(formatDue(null, today), "");
});

test("reads the dates the database gives", () => {
  assert.equal(formatDue("2026-10-13", today), "Overdue · Oct 13");
  assert.equal(formatDue("2026-10-20", today), "Oct 20");
});
