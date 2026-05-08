import { TOOLS, tierLabel } from "../character/tools.js";

const TOOL_ICONS = {
  hand: "🤚",
  axe: "🪓",
  pickaxe: "⛏️",
  bucket: "🪣",
  build: "🔨",
};

export function createToolbar({ root, mobileRoot = null, onSelect, onUpgrade }) {
  let lastKey = null;

  function buildButtons(container, activeTool, upgradedTools, forgeBuilt, blastFurnaceBuilt) {
    for (const tool of TOOLS) {
      const button = document.createElement("button");
      button.className = `tool-button${tool.id === activeTool ? " active" : ""}`;
      button.title = tool.label;
      const tier = upgradedTools?.[tool.id] ?? 1;
      const label = tierLabel(tier);
      button.innerHTML = `<span>${TOOL_ICONS[tool.id] ?? ""}</span><strong>${tool.label}</strong>${label ? `<em>${label}</em>` : ""}`;
      button.addEventListener("click", () => onSelect(tool.id));
      container.appendChild(button);
    }

    if (forgeBuilt || blastFurnaceBuilt) {
      const upgrade = document.createElement("button");
      upgrade.className = "upgrade-button";
      upgrade.textContent = "⬆ Upgrade";
      upgrade.addEventListener("click", onUpgrade);
      container.appendChild(upgrade);
    }
  }

  function render({ activeTool, upgradedTools, forgeBuilt, blastFurnaceBuilt }) {
    const key = `${activeTool},${Object.entries(upgradedTools).filter(([,v])=>v).map(([k,v])=>`${k}:${v}`).join("")},${forgeBuilt},${blastFurnaceBuilt}`;
    if (lastKey === key) return;
    lastKey = key;

    // Desktop sidebar
    root.innerHTML = `<h2>Tools</h2>`;
    buildButtons(root, activeTool, upgradedTools, forgeBuilt, blastFurnaceBuilt);

    // Mobile horizontal toolbar (rendered in parallel when present)
    if (mobileRoot) {
      mobileRoot.innerHTML = "";
      buildButtons(mobileRoot, activeTool, upgradedTools, forgeBuilt, blastFurnaceBuilt);
    }
  }

  return { render };
}
