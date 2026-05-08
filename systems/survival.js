const COLD_DEATH_THRESHOLD = 3600; // 1 hour without warmth

export function createSurvivalSystem(initial = {}) {
  const state = {
    stamina: initial.stamina ?? 100,
    hunger: initial.hunger ?? 100,
    dayTime: initial.dayTime ?? 0.22,
    eventName: initial.eventName ?? "Clear Skies",
    eventTimer: initial.eventTimer ?? 55,
    coldTime: initial.coldTime ?? 0,
  };

  const events = [
    { name: "Light Rain", duration: 55, farmSpeed: 0.65, waterBonus: 1 },
    { name: "Dry Spell", duration: 50, waterBonus: 2, hungerRate: 1.18 },
    { name: "Foraging Bloom", duration: 65, berryBonus: 1, hungerRate: 0.92 },
    { name: "Cold Night", duration: 45, nightPenalty: 1.35 },
  ];

  let eventIndex = initial.eventIndex ?? 0;

  function currentEvent() {
    return events.find((event) => event.name === state.eventName) ?? events[eventIndex % events.length];
  }

  function randomEvent() {
    const pool = events.filter((e) => e.name !== state.eventName);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function update(delta, modifiers = {}) {
    state.dayTime = (state.dayTime + delta / 240) % 1;
    const night = state.dayTime < 0.22 || state.dayTime > 0.78;
    const event = currentEvent();
    const nightPenalty = night ? (event.nightPenalty ?? 1.15) : 1;
    const shelterFactor = modifiers.shelter ? 0.72 : 1;
    const campfireFactor = modifiers.nearCampfire ? 0.55 : 1;
    const hungerRate = 0.55 * (event.hungerRate ?? 1) * nightPenalty * shelterFactor * campfireFactor;

    state.hunger = Math.max(0, state.hunger - delta * hungerRate);
    if (state.hunger <= 0) {
      state.stamina = Math.max(15, state.stamina - delta * 2.5);
    } else {
      const regen = modifiers.shelter ? 1.6 : modifiers.nearCampfire ? 3 : 1.2;
      state.stamina = Math.min(100, state.stamina + delta * regen);
    }

    // Temperature / cold system
    const nearWarmth = modifiers.nearCampfire || modifiers.nearBonfire;
    if (nearWarmth) {
      state.coldTime = Math.max(0, state.coldTime - delta * 2);
    } else {
      const coldRate = night ? 1.4 : 1;
      state.coldTime += delta * coldRate;
    }

    state.eventTimer -= delta;
    if (state.eventTimer <= 0) {
      const next = randomEvent();
      state.eventName = next.name;
      state.eventTimer = next.duration;
      return next;
    }

    return null;
  }

  function spendStamina(amount) {
    state.stamina = Math.max(0, state.stamina - amount);
  }

  function eat(foodAmount = 1) {
    state.hunger = Math.min(100, state.hunger + foodAmount * 18);
  }

  function isFrozen() {
    return state.coldTime >= COLD_DEATH_THRESHOLD;
  }

  function set(nextState = {}) {
    for (const key of ["stamina", "hunger", "dayTime", "eventTimer", "eventIndex", "coldTime"]) {
      if (Number.isFinite(nextState[key])) {
        if (key === "eventIndex") {
          eventIndex = nextState[key];
        } else {
          state[key] = nextState[key];
        }
      }
    }
    if (typeof nextState.eventName === "string") {
      state.eventName = nextState.eventName;
    }
  }

  function snapshot() {
    return {
      ...state,
      eventIndex,
    };
  }

  return {
    state,
    currentEvent,
    update,
    spendStamina,
    eat,
    set,
    snapshot,
    isFrozen,
  };
}
