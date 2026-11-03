import assert from "node:assert/strict";
import { test } from "node:test";
import { readSession, sessionValue } from "../src/auth.js";
import {
  escape,
  formatDue,
  isoDate,
  settingsPage,
  tasksPage,
} from "../src/views.js";

const today = new Date(2026, 9, 15);

test("escapes what people type", () => {
  assert.equal(
    escape(`<b>"Tom" & 'Jerry'</b>`),
    "&lt;b&gt;&quot;Tom&quot; &amp; &#39;Jerry&#39;&lt;/b&gt;",
  );
});

test("says when a task is due", () => {
  assert.equal(formatDue(new Date(2026, 9, 15), today), "Today");
  assert.equal(formatDue(new Date(2026, 9, 16), today), "Tomorrow");
  assert.equal(formatDue(new Date(2026, 9, 13), today), "Overdue · Oct 13");
  assert.equal(formatDue(new Date(2026, 9, 30), today), "Oct 30");
  assert.equal(formatDue(null, today), "");
});

test("gives a due date as YYYY-MM-DD, or null", () => {
  // The database driver reads a date as local midnight.
  assert.equal(isoDate(new Date(2026, 0, 5)), "2026-01-05");
  assert.equal(isoDate(new Date(2026, 11, 31)), "2026-12-31");
  assert.equal(isoDate(null), null);
});

test("lists tasks and counts the open ones", () => {
  const html = tasksPage({
    user: { name: "Demo" },
    people: [],
    today,
    tasks: [
      { title: "A", status: "todo", assignee: null, due_on: null },
      { title: "B", status: "done", assignee: "Léa", due_on: null },
    ],
  });
  assert.match(html, /1 open/);
  assert.match(html, /Nobody/);
});

test("filters tasks by status and counts each filter", () => {
  const tasks = [
    { title: "A", status: "todo", assignee: null, due_on: null },
    { title: "B", status: "doing", assignee: null, due_on: null },
    { title: "C", status: "doing", assignee: null, due_on: null },
    { title: "D", status: "done", assignee: null, due_on: null },
  ];
  const all = tasksPage({ user: { name: "Demo" }, people: [], today, tasks });
  assert.match(all, /All \(4\)/);
  assert.match(all, /To do \(1\)/);
  assert.match(all, /Doing \(2\)/);
  assert.match(all, /Done \(1\)/);
  assert.match(all, /href="\/\?status=doing"/);

  const doing = tasksPage({ user: { name: "Demo" }, people: [], today, tasks, status: "doing" });
  assert.match(doing, />B</);
  assert.match(doing, />C</);
  assert.doesNotMatch(doing, />A</);
  assert.doesNotMatch(doing, />D</);
  // Counts still describe every task, not just the ones shown.
  assert.match(doing, /All \(4\)/);

  const bogus = tasksPage({ user: { name: "Demo" }, people: [], today, tasks, status: "bogus" });
  assert.match(bogus, />A</);
});

test("the settings page keeps the name typed", () => {
  const html = settingsPage({
    user: { name: "Ann <3", email: "a@b.c" },
    saved: true,
  });
  assert.match(html, /value="Ann &lt;3"/);
  assert.match(html, /Saved/);
});

test("a session cookie cannot be forged", () => {
  const value = sessionValue(7, "secret");
  assert.equal(readSession(value, "secret"), 7);
  assert.equal(readSession(value.replace(/^7/, "8"), "secret"), null);
  assert.equal(readSession("7.nope", "secret"), null);
});
