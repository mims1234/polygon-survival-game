const RESOURCE_META = [
  ["wood", "🪵", "Wood"],
  ["stone", "🪨", "Stone"],
  ["food", "🍇", "Food"],
  ["water", "💧", "Water"],
  ["planks", "🪚", "Planks"],
  ["ingots", "🔩", "Ingots"],
  ["coins", "🪙", "Coins"],
];

export function createHUD({ resourceRoot, progressRoot }) {
  let lastResources = null;
  let lastProgress = null;

  function renderResources(resources) {
    const key = RESOURCE_META.map(([k]) => resources[k]).join(",") + "," + resources.capacity;
    if (lastResources === key) return;
    lastResources = key;
    resourceRoot.innerHTML = `
      <div class="resource-grid">
        ${RESOURCE_META.map(([key, emoji, label]) => {
          const full = resources[key] >= resources.capacity;
          return `
          <div class="resource-pill${full ? " full" : ""}" title="${label}${full ? " (Full)" : ""}">
            <span>${emoji}</span>
            <span>${resources[key]}</span>
          </div>`;
        }).join("")}
        <div class="resource-pill capacity" title="Storage Capacity">
          <span>🗄️</span>
          <span>${resources.capacity}</span>
        </div>
      </div>
    `;
  }

  function renderProgress({ level, xp, xpTarget, empireScore }) {
    const key = `${level},${xp},${xpTarget},${empireScore}`;
    if (lastProgress === key) return;
    lastProgress = key;
    const pct = Math.max(0, Math.min(100, (xp / xpTarget) * 100));
    progressRoot.innerHTML = `
      <div class="progress-grid">
        <div class="progress-meta">
          <span>Level ${level}</span>
          <span>Empire Score ${empireScore}</span>
        </div>
        <div class="xp-track">
          <div class="xp-fill" style="width: ${pct}%"></div>
        </div>
        <div class="progress-meta">
          <span>${xp} / ${xpTarget} XP</span>
          <span>Tier ${Math.min(level, 6)} / 6</span>
        </div>
      </div>
    `;
  }

  return {
    renderResources,
    renderProgress,
  };
}

