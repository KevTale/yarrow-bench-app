import assert from "node:assert/strict";
import { test } from "node:test";
import { listTasks, pool } from "../src/db.js";

test("the task list is read in one query, however many tasks there are", async (t) => {
  const tasks = Array.from({ length: 3000 }, (_, index) => ({
    id: index + 1,
    title: `Task ${index + 1}`,
    comments: index % 4,
  }));
  const query = t.mock.method(pool, "query", async () => ({ rows: tasks }));
  assert.deepEqual(await listTasks(), tasks);
  assert.equal(query.mock.callCount(), 1);
  assert.match(query.mock.calls[0].arguments[0], /FROM comments GROUP BY task_id/);
});
