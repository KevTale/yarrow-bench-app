const DAY = 24 * 60 * 60 * 1000;
const dayStart = (date) =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

/** When a task is due, in the app and the digest: "Today", "Tomorrow", "Overdue · Oct 3" or "Oct 20". */
export function formatDue(due, today = new Date()) {
  if (!due) return "";
  const date = due instanceof Date ? due : new Date(`${due}T00:00:00`);
  const days = Math.round((dayStart(date) - dayStart(today)) / DAY);
  const label = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 0) return `Overdue · ${label}`;
  return label;
}
