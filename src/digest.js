import { escape, STATUS } from "./views.js";

const DAY = 24 * 60 * 60 * 1000;
const dayStart = (date) =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

const toDate = (due) =>
  due instanceof Date ? due : new Date(`${due}T00:00:00`);
const daysUntil = (date, today) =>
  Math.round((dayStart(date) - dayStart(today)) / DAY);

const isOverdue = (task, today) =>
  Boolean(task.due_on) && daysUntil(toDate(task.due_on), today) < 0;

/** The due date as the digest says it: "Today", "Tomorrow", "Overdue · Oct 3" or "Oct 20". */
export function dueLabel(due, today = new Date()) {
  if (!due) return "";
  const date = toDate(due);
  const days = daysUntil(date, today);
  const label = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 0) return `Overdue · ${label}`;
  return label;
}

/** The weekly digest of one person's open tasks, as HTML and plain text. */
export function digestEmail({ user, tasks, today = new Date() }) {
  const open = tasks.filter((task) => task.status !== "done");
  const subject = `Your week in Tally: ${open.length} open task${open.length === 1 ? "" : "s"}`;
  const overdue = open.filter((task) => isOverdue(task, today));
  const later = open.filter((task) => !isOverdue(task, today));
  // Overdue tasks first, under their own heading; no heading for an empty group.
  const groups = [
    ["Overdue", overdue],
    ["This week and later", later],
  ].filter(([, group]) => group.length);
  const rows = (group) =>
    group
      .map(
        (task) => `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #eef0f3">${escape(task.title)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eef0f3;color:#7a8291">${STATUS[task.status]}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eef0f3;text-align:right">${escape(dueLabel(task.due_on, today))}</td>
    </tr>`,
      )
      .join("\n");
  const sections = groups
    .map(
      ([heading, group]) =>
        `<h2 style="margin:20px 0 4px;font-size:15px">${heading}</h2>
    <table style="width:100%;border-collapse:collapse">${rows(group)}</table>`,
    )
    .join("\n    ");
  const html = `<!doctype html>
<html><body style="margin:0;background:#f5f6f8;font:15px/1.5 system-ui,sans-serif;color:#1d2129">
  <div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #e3e6eb;border-radius:10px;padding:28px">
    <p style="margin:0 0 4px;font-weight:700;color:#4b3fd8">Tally</p>
    <h1 style="margin:0 0 16px;font-size:20px">Hi ${escape(user.name.split(" ")[0])}, here is your week</h1>
    ${
      open.length
        ? sections
        : `<p style="color:#7a8291">Nothing open. Enjoy your week.</p>`
    }
    <p style="margin:24px 0 0;font-size:13px;color:#7a8291">You get this every Monday. Turn it off in Settings.</p>
  </div>
</body></html>`;
  const text = [
    `Hi ${user.name.split(" ")[0]}, here is your week`,
    ...groups.flatMap(([heading, group]) => [
      "",
      heading,
      ...group.map(
        (task) =>
          `- ${task.title} (${STATUS[task.status]}${task.due_on ? `, ${dueLabel(task.due_on, today)}` : ""})`,
      ),
    ]),
  ].join("\n");
  return { subject, html, text };
}
