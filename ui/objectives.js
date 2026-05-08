export function createObjectivePanel({ root }) {
  let lastKey = null;

  function render(objectives) {
    const completed = objectives.filter((objective) => objective.complete).length;
    const pending = objectives.filter((objective) => !objective.complete);
    const active = pending.slice(0, 3);
    const extra = pending.length - active.length;
    const key = `${completed},${active.map((o) => o.id).join(",")},${extra}`;
    if (lastKey === key) return;
    lastKey = key;
    root.innerHTML = `
      <h2>Objectives <span>${completed}/${objectives.length}</span></h2>
      <div class="objective-list">
        ${active.map((objective) => `
          <div class="objective-item">
            <span>•</span>
            <p>${objective.label}</p>
          </div>
        `).join("")}
        ${extra > 0 ? `<div class="objective-item objective-more"><span>+${extra} more</span></div>` : ""}
      </div>
    `;
  }

  return { render };
}
