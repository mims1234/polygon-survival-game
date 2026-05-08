import { AUTOMATION, RECIPES, canUseRecipe } from "../systems/crafting.js";

const ICONS = {
  wood: "🪵", stone: "🪨", food: "🍇", water: "💧",
  planks: "🪚", ingots: "🔩", coins: "🪙",
};

function costText(cost = {}) {
  return Object.entries(cost).map(([key, value]) => `${ICONS[key] ?? ""}${value} ${key}`).join(" + ");
}

function gainText(gain = {}) {
  return Object.entries(gain).map(([key, value]) => `${ICONS[key] ?? ""}${value} ${key}`).join(" + ");
}

export function createCraftingPanel({ root, onCraft }) {
  let lastKey = null;

  function render({ inventory, hasBuilding }) {
    const key = RECIPES.map((r) => {
      const unlocked = canUseRecipe(r, hasBuilding);
      const affordable = Object.entries(r.cost).every(([k, v]) => inventory[k] >= v);
      return `${r.id}:${unlocked && affordable ? 1 : 0}`;
    }).join(",") + "|" + AUTOMATION.map((a) => `${a.building}:${hasBuilding(a.building) ? 1 : 0}`).join(",");
    if (lastKey === key) return;
    lastKey = key;
    root.innerHTML = `
      <h2>Craft</h2>
      <div class="craft-list">
        ${RECIPES.map((recipe) => {
          const unlocked = canUseRecipe(recipe, hasBuilding);
          const affordable = Object.entries(recipe.cost).every(([key, value]) => inventory[key] >= value);
          return `
            <button class="craft-button${unlocked && affordable ? "" : " disabled"}" data-recipe="${recipe.id}" ${unlocked && affordable ? "" : "disabled"}>
              <strong>${recipe.name}</strong>
              <span>${costText(recipe.cost)} → ${gainText(recipe.gain)}</span>
            </button>
          `;
        }).join("")}
      </div>
      <h2>Automation</h2>
      <div class="automation-list">
        ${AUTOMATION.map((item) => `
          <p>${hasBuilding(item.building) ? "On" : "Off"} · ${item.building} · +${gainText(item.gain)}</p>
        `).join("")}
      </div>
    `;

    root.querySelectorAll("[data-recipe]").forEach((button) => {
      button.addEventListener("click", () => onCraft(button.dataset.recipe));
    });
  }

  return { render };
}
