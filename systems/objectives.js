export const OBJECTIVES = [
  { id: "campfire", label: "Build a Campfire", type: "building", target: "campfire", reward: { xp: 30, resources: { food: 2 } } },
  { id: "wood10", label: "Store 10 Wood", type: "resource", resource: "wood", amount: 10, reward: { xp: 25 } },
  { id: "shelter", label: "Build a Shelter", type: "building", target: "shelter", reward: { xp: 40, resources: { wood: 4 } } },
  { id: "level2", label: "Reach Level 2", type: "level", amount: 2, reward: { xp: 20, resources: { stone: 3 } } },
  { id: "farm", label: "Build a Farm", type: "building", target: "farm", reward: { xp: 45, resources: { water: 3 } } },
  { id: "watchtower", label: "Raise a Watchtower", type: "building", target: "watchtower", reward: { xp: 55 } },
  { id: "forge", label: "Build a Forge", type: "building", target: "forge", reward: { xp: 65, resources: { stone: 5 } } },
  { id: "market", label: "Found a Market", type: "building", target: "market", reward: { xp: 100 } },
  { id: "upgrade1", label: "Upgrade a Building", type: "upgrade", reward: { xp: 50, resources: { coins: 2 } } },
  { id: "explore1", label: "Visit a New Region", type: "explore", reward: { xp: 30, resources: { food: 3 } } },
];

export function createObjectiveSystem({ inventory, progression, buildings, onReward }) {
  const completed = new Set();
  let upgradeAwarded = false;
  let exploreAwarded = false;

  function isComplete(objective) {
    if (completed.has(objective.id)) {
      return true;
    }

    if (objective.type === "building") {
      return buildings.buildings.some((building) => building.id === objective.target);
    }

    if (objective.type === "resource") {
      return (inventory.state[objective.resource] ?? 0) >= objective.amount;
    }

    if (objective.type === "level") {
      return progression.state.level >= objective.amount;
    }

    if (objective.type === "upgrade") {
      return upgradeAwarded;
    }

    if (objective.type === "explore") {
      return exploreAwarded;
    }

    return false;
  }

  function award(objective) {
    const reward = objective.reward ?? {};
    if (reward.xp) {
      progression.gainXP(reward.xp);
    }
    for (const [resource, amount] of Object.entries(reward.resources ?? {})) {
      inventory.add(resource, amount);
    }
    onReward?.(objective, reward);
  }

  function update() {
    for (const objective of OBJECTIVES) {
      if (!completed.has(objective.id) && isComplete(objective)) {
        completed.add(objective.id);
        award(objective);
      }
    }
  }

  function markUpgrade() {
    if (!upgradeAwarded) {
      upgradeAwarded = true;
      update();
    }
  }

  function markExplore() {
    if (!exploreAwarded) {
      exploreAwarded = true;
      update();
    }
  }

  function list() {
    return OBJECTIVES.map((objective) => ({
      ...objective,
      complete: completed.has(objective.id),
    }));
  }

  function set(data = []) {
    const ids = Array.isArray(data) ? data : data.ids ?? [];
    completed.clear();
    for (const id of ids) {
      completed.add(id);
    }
    if (data.upgradeAwarded) upgradeAwarded = true;
    if (data.exploreAwarded) exploreAwarded = true;
  }

  function snapshot() {
    return {
      ids: [...completed],
      upgradeAwarded,
      exploreAwarded,
    };
  }

  return {
    update,
    list,
    set,
    snapshot,
    markUpgrade,
    markExplore,
  };
}
