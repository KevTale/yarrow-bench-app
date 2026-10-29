/** Whether a task's title contains what was typed, whatever the case. */
export function matches(title, query) {
  const text = query.trim().toLocaleLowerCase();
  return !text || title.toLocaleLowerCase().includes(text);
}

const search = typeof document !== "undefined" && document.getElementById("search");
if (search) {
  const rows = [...document.querySelectorAll("tr[data-title]")];
  const none = document.getElementById("no-match");
  const filter = () => {
    let shown = 0;
    for (const row of rows) {
      row.hidden = !matches(row.dataset.title, search.value);
      if (!row.hidden) shown++;
    }
    none.hidden = shown > 0 || rows.length === 0;
    none.firstElementChild.textContent = `No tasks match “${search.value.trim()}”`;
  };
  search.addEventListener("input", filter);
  // The browser may restore what was typed when coming back to the page.
  window.addEventListener("pageshow", filter);
}
