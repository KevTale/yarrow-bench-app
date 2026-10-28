/** True when the title contains the query, whatever the case. */
export const titleMatches = (title, query) =>
  title.toLowerCase().includes(query.trim().toLowerCase());

// Narrows the task list as people type in the search field.
const field =
  typeof document === "undefined"
    ? null
    : document.getElementById("task-search");
if (field) {
  const rows = [...document.querySelectorAll("tr.task")];
  const noMatch = document.querySelector("tr.no-match");
  const filter = () => {
    let shown = 0;
    for (const row of rows) {
      const match = titleMatches(row.cells[0].textContent, field.value);
      row.hidden = !match;
      if (match) shown++;
    }
    noMatch.hidden = shown > 0 || rows.length === 0;
  };
  field.addEventListener("input", filter);
  filter();
}
