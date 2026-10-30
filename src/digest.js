import { formatDue } from "./due.js";
import { escape, STATUS } from "./views.js";

/** The weekly digest of one person's open tasks, as HTML and plain text. */
export function digestEmail({ user, tasks, today = new Date() }) {
  const open = tasks.filter((task) => task.status !== "done");
  const subject = `Your week in Tally: ${open.length} open task${open.length === 1 ? "" : "s"}`;
  const items = open
    .map(
      (task) => `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #eef0f3">${escape(task.title)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eef0f3;color:#7a8291">${STATUS[task.status]}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eef0f3;text-align:right">${escape(formatDue(task.due_on, today))}</td>
    </tr>`,
    )
    .join("\n");
  const html = `<!doctype html>
<html><body style="margin:0;background:#f5f6f8;font:15px/1.5 system-ui,sans-serif;color:#1d2129">
  <div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #e3e6eb;border-radius:10px;padding:28px">
    <p style="margin:0 0 4px;font-weight:700;color:#4b3fd8">Tally</p>
    <h1 style="margin:0 0 16px;font-size:20px">Hi ${escape(user.name.split(" ")[0])}, here is your week</h1>
    ${
      open.length
        ? `<table style="width:100%;border-collapse:collapse">${items}</table>`
        : `<p style="color:#7a8291">Nothing open. Enjoy your week.</p>`
    }
    <p style="margin:24px 0 0;font-size:13px;color:#7a8291">You get this every Monday. Turn it off in Settings.</p>
  </div>
</body></html>`;
  const text = [
    `Hi ${user.name.split(" ")[0]}, here is your week`,
    "",
    ...open.map(
      (task) =>
        `- ${task.title} (${STATUS[task.status]}${task.due_on ? `, ${formatDue(task.due_on, today)}` : ""})`,
    ),
  ].join("\n");
  return { subject, html, text };
}
