// Narrows the task list to the titles that contain what is typed, whatever the case.
const search = document.getElementById("search");
const rows = [...document.querySelectorAll("tbody tr[data-title]")];
const noMatch = document.getElementById("no-match");

function narrow() {
  const text = search.value.trim();
  const needle = text.toLowerCase();
  let shown = 0;
  for (const row of rows) {
    row.hidden = !row.dataset.title.toLowerCase().includes(needle);
    if (!row.hidden) shown++;
  }
  noMatch.hidden = shown > 0 || rows.length === 0;
  noMatch.firstElementChild.textContent = `No tasks match "${text}"`;
}

search.addEventListener("input", narrow);
// The browser may restore what was typed when coming back to the page.
narrow();
