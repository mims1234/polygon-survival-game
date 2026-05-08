import { getBuildingById } from "../buildings/registry.js";

const TILE_LABELS = {
  grass: "Grass",
  dirt: "Dirt",
  rock: "Rock",
  water: "Water",
  forest: "Forest",
};

const TOOL_LABELS = {
  hand: "Hand",
  axe: "Axe",
  pickaxe: "Pickaxe",
  bucket: "Bucket",
};

export function createInspector({ root, onUpgradeBuilding }) {
  let lastKey = null;

  function render({ tile, resource, building, activeTool, canUpgrade }) {
    const key = `${tile?.index ?? "null"},${resource?.kind ?? "null"},${building?.name ?? "null"},${activeTool},${canUpgrade ?? false}`;
    if (lastKey === key) return;
    lastKey = key;
    if (!tile || !tile.discovered) {
      root.innerHTML = `
        <h2>Tile</h2>
        <p>Unexplored</p>
      `;
      return;
    }

    const lines = [];
    lines.push(`<p>${TILE_LABELS[tile.type] ?? tile.type}</p>`);

    if (resource) {
      lines.push(`<p>${resource.kind} node · ${TOOL_LABELS[resource.tool]} required</p>`);
    } else if (tile.type === "water") {
      lines.push(`<p>Water source · Bucket required</p>`);
    } else {
      lines.push(`<p>${tile.buildable ? "Buildable" : "Not buildable"}</p>`);
    }

    if (building) {
      lines.push(`<p><strong>${building.name}</strong></p>`);
      const def = getBuildingById(building.id);
      if (def?.upgrade && canUpgrade) {
        lines.push(`<button class="upgrade-building-btn" data-upgrade="${def.upgrade.to}">Upgrade to ${def.upgrade.to}</button>`);
      }
    }

    lines.push(`<p>Active: ${activeTool}</p>`);

    root.innerHTML = `
      <h2>Tile</h2>
      ${lines.join("")}
    `;

    root.querySelector(".upgrade-building-btn")?.addEventListener("click", (e) => {
      onUpgradeBuilding?.(e.target.dataset.upgrade);
    });
  }

  return { render };
}
