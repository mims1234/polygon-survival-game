const RESOURCE_KEYS = ["wood", "stone", "food", "water", "planks", "ingots", "coins"];

export function createInventory(initial = {}) {
  const state = {
    wood: initial.wood ?? 6,
    stone: initial.stone ?? 4,
    food: initial.food ?? 3,
    water: initial.water ?? 1,
    planks: initial.planks ?? 0,
    ingots: initial.ingots ?? 0,
    coins: initial.coins ?? 0,
    capacity: initial.capacity ?? 10,
  };

  function canAfford(cost) {
    return Object.entries(cost ?? {}).every(([key, value]) => (state[key] ?? 0) >= value);
  }

  function spend(cost) {
    const c = cost ?? {};
    if (!canAfford(c)) {
      return false;
    }

    for (const [key, value] of Object.entries(c)) {
      state[key] -= value;
    }
    return true;
  }

  let capacityBonus = 0;

  function setCapacityBonus(bonus) {
    capacityBonus = bonus;
  }

  function effectiveCapacity() {
    return state.capacity + capacityBonus;
  }

  function add(resource, amount = 1) {
    if (resource === "capacity") {
      state.capacity += amount;
      return amount;
    }

    const cap = effectiveCapacity();
    const before = state[resource] ?? 0;
    state[resource] = Math.min(cap, before + amount);
    return state[resource] - before;
  }

  function set(nextState = {}) {
    for (const key of [...RESOURCE_KEYS, "capacity"]) {
      if (Number.isFinite(nextState[key])) {
        state[key] = nextState[key];
      }
    }
  }

  function snapshot() {
    return RESOURCE_KEYS.reduce((acc, key) => {
      acc[key] = state[key];
      return acc;
    }, { capacity: state.capacity });
  }

  return {
    state,
    add,
    set,
    spend,
    canAfford,
    snapshot,
    setCapacityBonus,
    effectiveCapacity,
  };
}
