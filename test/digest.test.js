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

test("the digest puts the overdue tasks first, under their own heading", () => {
  const email = digestEmail({
    user: { name: "Léa Martin" },
    today,
    tasks: [
      { title: "Write the brief", status: "doing", due_on: "2026-10-20" },
      { title: "Call Acme", status: "todo", due_on: "2026-10-13" },
      { title: "Tidy the wiki", status: "todo", due_on: null },
      { title: "Pay the invoice", status: "todo", due_on: new Date(2026, 9, 14) },
    ],
  });
  assert.equal(
    email.text,
    [
      "Hi Léa, here is your week",
      "",
      "Overdue",
      "- Call Acme (To do, Overdue · Oct 13)",
      "- Pay the invoice (To do, Overdue · Oct 14)",
      "",
      "This week and later",
      "- Write the brief (Doing, Oct 20)",
      "- Tidy the wiki (To do)",
    ].join("\n"),
  );
  const order = ["Overdue", "Call Acme", "Pay the invoice", "This week and later", "Write the brief", "Tidy the wiki"]
    .map((text) => email.html.indexOf(text));
  assert.ok(order.every((at, index) => at > (order[index - 1] ?? -1)), `${order}`);
});

test("the digest has no Overdue heading when nothing is overdue", () => {
  const email = digestEmail({
    user: { name: "Léa Martin" },
    today,
    tasks: [{ title: "Write the brief", status: "doing", due_on: "2026-10-15" }],
  });
  assert.doesNotMatch(email.html, />Overdue</);
  assert.doesNotMatch(email.text, /^Overdue$/m);
  assert.match(email.html, />This week and later</);
  assert.match(email.text, /^This week and later\n- Write the brief \(Doing, Today\)$/m);
});
