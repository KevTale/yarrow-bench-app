import assert from "node:assert/strict";
import { test } from "node:test";
import { readSession, sessionValue } from "../src/auth.js";
import {
  escape,
  formatDue,
  settingsPage,
  statusFilter,
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

test("filters tasks by status and counts each one", () => {
  const page = (status) =>
    tasksPage({
      user: { name: "Demo" },
      people: [],
      today,
      status,
      tasks: [
        { title: "A", status: "todo", assignee: null, due_on: null },
        { title: "B", status: "done", assignee: null, due_on: null },
        { title: "C", status: "done", assignee: null, due_on: null },
      ],
    });
  const all = page(null);
  assert.match(all, /<a href="\/" aria-current="page">All <span class="count">3<\/span>/);
  assert.match(all, /href="\/\?status=todo">To do <span class="count">1</);
  assert.match(all, /href="\/\?status=doing">Doing <span class="count">0</);
  assert.match(all, /href="\/\?status=done">Done <span class="count">2</);
  assert.match(all, /<td>A<\/td>/);

  const done = page("done");
  assert.match(done, /href="\/\?status=done" aria-current="page">Done/);
  assert.doesNotMatch(done, /<td>A<\/td>/);
  assert.match(done, /<td>B<\/td>/);
  assert.match(done, /<td>C<\/td>/);
  assert.match(done, /1 open/);

  assert.match(page("doing"), /No tasks in Doing/);
});

test("only known statuses filter the list", () => {
  assert.equal(statusFilter("doing"), "doing");
  assert.equal(statusFilter(undefined), null);
  assert.equal(statusFilter("archived"), null);
  assert.equal(statusFilter("constructor"), null);
  assert.equal(statusFilter(["done", "todo"]), null);
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
