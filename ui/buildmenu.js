import { getVisibleBuildings } from "../buildings/registry.js";

function costText(cost) {
  if (!cost) return "";
  const map = { wood: "🪵", stone: "🪨", food: "🍇", water: "💧", planks: "🪚", ingots: "🔩", coins: "🪙" };
  return Object.entries(cost)
    .map(([key, value]) => `${map[key] ?? ""} ${value}`)
    .join("  ");
}

export function createBuildMenu({ root, onSelect, onTrade }) {
  let lastKey = null;

  function render({ activeBuildingId, inventory, level, canTrade, isTradeHub = false, counts = {} }) {
    const visible = getVisibleBuildings();
    const key = `${activeBuildingId},${level},${canTrade},${isTradeHub},` + visible.map((b) => `${inventory[b.id] ?? 0 >= (b.cost?.[Object.keys(b.cost)[0]] ?? 0) ? 1 : 0}`).join("") + "," + Object.entries(counts).map(([k,v])=>`${k}:${v}`).join("");
    if (lastKey === key) return;
    lastKey = key;
    root.innerHTML = "<h2>Build</h2>";
    const grid = document.createElement("div");
    grid.className = "build-grid";

    for (const building of visible) {
      const unlocked = level >= building.unlockLevel;
      const affordable = building.cost && Object.entries(building.cost).every(([key, value]) => inventory[key] >= value);
      const card = document.createElement("button");
      const cardState = !unlocked ? " locked" : !affordable ? " disabled" : building.id === activeBuildingId ? " active" : "";
      card.className = `build-card${cardState}`;
      card.disabled = !unlocked || !affordable;
      const count = counts[building.id] ?? 0;
      card.innerHTML = `
        <h3>${building.name}${count > 0 ? ` <span style="color:#f2c84b">×${count}</span>` : ""}</h3>
        <p>${unlocked ? `Lv ${building.unlockLevel}` : `Locked Lv ${building.unlockLevel}`}</p>
        <div class="cost-row">${costText(building.cost)}</div>
        <small>${building.effect}</small>
      `;
      card.addEventListener("click", () => {
        if (unlocked && affordable) {
          onSelect(building.id);
        }
      });
      grid.appendChild(card);
    }

    root.appendChild(grid);

    if (onTrade && canTrade) {
      const trade = document.createElement("button");
      trade.className = "trade-button";
      const costStr = isTradeHub ? "4 🍇 + 2 💧" : "5 🍇 + 3 💧";
      const gainStr = isTradeHub ? "3 🪵 + 3 🪨" : "2 🪵 + 2 🪨";
      trade.textContent = `Trade: ${costStr} → ${gainStr}`;
      trade.addEventListener("click", onTrade);
      root.appendChild(trade);
    }
  }

  return { render };
}
