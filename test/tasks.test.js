import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { sessionValue } from "../src/auth.js";
import { pool } from "../src/db.js";

process.env.SESSION_SECRET = "test-secret";
const { default: app } = await import("../src/server.js");

// No database: the signed-in user and the inserted tasks are faked.
let inserted;
pool.query = async (sql, params) => {
  if (sql.includes("FROM users WHERE id"))
    return { rows: [{ id: 1, name: "Demo" }] };
  if (sql.startsWith("INSERT INTO tasks")) inserted.push(params);
  return { rows: [] };
};

let server;
let base;
before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());
beforeEach(() => {
  inserted = [];
});

const addTask = (form) =>
  fetch(`${base}/tasks`, {
    method: "POST",
    redirect: "manual",
    headers: {
      cookie: `session=${sessionValue(1, "test-secret")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(form).toString(),
  });

test("a new task gets the priority picked", async () => {
  const response = await addTask({ title: "Urgent", priority: "high" });
  assert.equal(response.status, 302);
  assert.equal(inserted.length, 1);
  assert.equal(inserted[0][3], "high");
});

test("a new task without a priority is normal", async () => {
  const response = await addTask({ title: "Usual" });
  assert.equal(response.status, 302);
  assert.equal(inserted[0][3], "normal");
});

test("an unknown priority is refused", async () => {
  for (const form of [
    { title: "A", priority: "urgent" },
    { title: "B", priority: "" },
    [["title", "C"], ["priority", "high"], ["priority", "low"]],
  ]) {
    const response = await addTask(form);
    assert.equal(response.status, 400);
  }
  assert.equal(inserted.length, 0);
});
