import assert from "node:assert/strict";
import { test } from "node:test";
import { readSession, sessionValue } from "../src/auth.js";
import {
  escape,
  formatDue,
  parseFilter,
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

test("filters the tasks by status and counts each one", () => {
  const tasks = [
    { title: "Write", status: "todo", assignee: null, due_on: null },
    { title: "Review", status: "doing", assignee: null, due_on: null },
    { title: "Ship", status: "done", assignee: null, due_on: null },
    { title: "Plan", status: "todo", assignee: null, due_on: null },
  ];
  const page = (filter) =>
    tasksPage({ user: { name: "Demo" }, people: [], today, tasks, filter });

  const all = page("all");
  assert.match(
    all,
    /<a href="\/" aria-current="page">All <span class="count">4<\/span>/,
  );
  assert.match(
    all,
    /<a href="\/\?status=todo">To do <span class="count">2<\/span>/,
  );
  assert.match(
    all,
    /<a href="\/\?status=doing">Doing <span class="count">1<\/span>/,
  );
  assert.match(
    all,
    /<a href="\/\?status=done">Done <span class="count">1<\/span>/,
  );
  for (const title of ["Write", "Review", "Ship", "Plan"])
    assert.match(all, new RegExp(`<td>${title}</td>`));

  const todo = page("todo");
  assert.match(todo, /href="\/\?status=todo" aria-current="page"/);
  assert.match(todo, /<td>Write<\/td>/);
  assert.match(todo, /<td>Plan<\/td>/);
  assert.doesNotMatch(todo, /<td>Review<\/td>|<td>Ship<\/td>/);
  assert.match(todo, /3 open/);
});

test("an unknown status in the address shows All", () => {
  assert.equal(parseFilter(undefined), "all");
  assert.equal(parseFilter("nope"), "all");
  assert.equal(parseFilter("toString"), "all");
  assert.equal(parseFilter(["doing"]), "all");
  assert.equal(parseFilter("doing"), "doing");
});

test("a filter with no tasks says so", () => {
  const html = tasksPage({
    user: { name: "Demo" },
    people: [],
    today,
    filter: "done",
    tasks: [{ title: "A", status: "todo", assignee: null, due_on: null }],
  });
  assert.match(html, /No tasks in Done/);
});
