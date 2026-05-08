export const RECIPES = [
  { id: "planks", name: "Mill Planks", cost: { wood: 3 }, gain: { planks: 2 }, needs: null },
  { id: "ingots", name: "Smelt Ingots", cost: { stone: 4, water: 1 }, gain: { ingots: 1 }, needs: "forge" },
  { id: "ingots_cheap", name: "Smelt Ingots (Efficient)", cost: { stone: 3, water: 1 }, gain: { ingots: 1 }, needs: "blastfurnace" },
  { id: "coins", name: "Mint Coins", cost: { food: 3, planks: 1 }, gain: { coins: 1 }, needs: "market" },
  { id: "coins_bonus", name: "Mint Coins (Bulk)", cost: { food: 5, planks: 2 }, gain: { coins: 3 }, needs: "tradehub" },
];

export const AUTOMATION = [
  { building: "lumbercamp", every: 18, cost: { food: 1 }, gain: { wood: 1 } },
  { building: "sawmill", every: 18, cost: { food: 1 }, gain: { wood: 2 } },
  { building: "quarry", every: 22, cost: { wood: 1 }, gain: { stone: 1 } },
  { building: "deepquarry", every: 22, cost: { wood: 1 }, gain: { stone: 2 } },
  { building: "well", every: 16, gain: { water: 1 } },
  { building: "deepwell", every: 16, gain: { water: 2 } },
  { building: "workshop", every: 28, cost: { wood: 2 }, gain: { planks: 1 } },
  { building: "factory", every: 20, cost: { wood: 1 }, gain: { planks: 1 } },
];

export function canUseRecipe(recipe, hasBuilding) {
  return !recipe.needs || hasBuilding(recipe.needs);
}
