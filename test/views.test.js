import assert from "node:assert/strict";
import { test } from "node:test";
import { readSession, sessionValue } from "../src/auth.js";
import { escape, formatDue, settingsPage, tasksPage } from "../src/views.js";

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

const mixed = [
  { title: "Write docs", status: "todo", assignee: null, due_on: null },
  { title: "Fix login", status: "doing", assignee: null, due_on: null },
  { title: "Fix export", status: "doing", assignee: null, due_on: null },
  { title: "Ship it", status: "done", assignee: null, due_on: null },
];
const page = (status) =>
  tasksPage({ user: { name: "Demo" }, people: [], today, tasks: mixed, status });

test("shows every task under All by default, with a count per filter", () => {
  const html = page(undefined);
  assert.match(html, /<a href="\/" aria-current="page">All <span class="count">4<\/span>/);
  assert.match(html, /<a href="\/\?status=todo">To do <span class="count">1<\/span>/);
  assert.match(html, /<a href="\/\?status=doing">Doing <span class="count">2<\/span>/);
  assert.match(html, /<a href="\/\?status=done">Done <span class="count">1<\/span>/);
  for (const task of mixed) assert.match(html, new RegExp(task.title));
});

test("the filters sit on the title line, after the open total", () => {
  assert.match(
    page("doing"),
    /<div class="head">\s*<h1>Tasks<\/h1>\s*<p class="muted">3 open<\/p>\s*<nav class="filters"[^]*?<\/nav>\s*<\/div>/,
  );
});

test("a status filter shows only its tasks and keeps the counts", () => {
  const html = page("doing");
  assert.match(html, /<a href="\/\?status=doing" aria-current="page">Doing/);
  assert.match(html, /Fix login/);
  assert.match(html, /Fix export/);
  assert.doesNotMatch(html, /Write docs|Ship it/);
  assert.match(html, /All <span class="count">4/);
  assert.match(html, /3 open/);
});

test("an unknown status falls back to All", () => {
  for (const status of ["nope", "toString", ["doing"]]) {
    const html = page(status);
    assert.match(html, /<a href="\/" aria-current="page">All/);
    assert.match(html, /Ship it/);
  }
});

test("an empty filter says so", () => {
  const html = tasksPage({
    user: { name: "Demo" },
    people: [],
    today,
    tasks: [mixed[0]],
    status: "done",
  });
  assert.match(html, /No tasks in Done/);
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
