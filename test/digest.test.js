import assert from "node:assert/strict";
import { test } from "node:test";
import { digestEmail, dueLabel } from "../src/digest.js";

const today = new Date(2026, 9, 15);

test("the digest lists the open tasks only", () => {
  const email = digestEmail({
    user: { name: "Léa Martin" },
    today,
    tasks: [
      { title: "Plan <release>", status: "todo", due_on: "2026-10-20" },
      { title: "Renew", status: "done", due_on: null },
    ],
  });
  assert.equal(email.subject, "Your week in Tally: 1 open task");
  assert.match(email.html, /Hi Léa/);
  assert.match(email.html, /Plan &lt;release&gt;/);
  assert.doesNotMatch(email.html, /Renew/);
  assert.match(email.text, /- Plan <release> \(To do, Oct 20\)/);
});

test("the digest says when a task is due", () => {
  assert.equal(dueLabel("2026-10-13", today), "Overdue · Oct 13");
  assert.equal(dueLabel(null, today), "");
});

test("the digest puts overdue tasks first, under their own heading", () => {
  const email = digestEmail({
    user: { name: "Léa Martin" },
    today,
    tasks: [
      { title: "Write notes", status: "doing", due_on: "2026-10-20" },
      { title: "Book room", status: "todo", due_on: null },
      { title: "Pay invoice", status: "todo", due_on: "2026-10-13" },
      { title: "Old done", status: "done", due_on: "2026-10-01" },
    ],
  });
  const order = (body) =>
    [
      "Overdue",
      "Pay invoice",
      "This week and later",
      "Write notes",
      "Book room",
    ].map((word) => body.indexOf(word));
  for (const body of [email.html, email.text]) {
    const positions = order(body);
    assert.ok(
      positions.every((at) => at >= 0),
      body,
    );
    assert.deepEqual(
      [...positions].sort((a, b) => a - b),
      positions,
    );
  }
  assert.match(
    email.text,
    /Overdue\n- Pay invoice \(To do, Overdue · Oct 13\)\n\nThis week and later\n- Write notes/,
  );
  assert.doesNotMatch(email.html, /Old done/);
});

test("the digest has no Overdue heading when nothing is overdue", () => {
  const email = digestEmail({
    user: { name: "Léa Martin" },
    today,
    tasks: [
      { title: "Due today", status: "todo", due_on: "2026-10-15" },
      { title: "Late but done", status: "done", due_on: "2026-10-01" },
    ],
  });
  assert.doesNotMatch(email.html, /Overdue/);
  assert.doesNotMatch(email.text, /Overdue/);
  assert.match(email.html, /This week and later/);
});
