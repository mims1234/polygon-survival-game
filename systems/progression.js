const LEVEL_THRESHOLDS = [0, 80, 200, 380, 640, 1000];

export function createProgression() {
  const state = {
    xp: 0,
    level: 1,
    empireScore: 0,
  };

  function xpForLevelUp() {
    return LEVEL_THRESHOLDS[state.level] ?? 1000;
  }

  function gainXP(amount) {
    state.xp += amount;
    const target = xpForLevelUp();
    while (state.xp >= target && state.level < 6) {
      state.xp -= target;
      state.level += 1;
    }
  }

  function addScore(amount) {
    state.empireScore += amount;
  }

  function set(nextState = {}) {
    if (Number.isFinite(nextState.xp)) {
      state.xp = nextState.xp;
    }
    if (Number.isFinite(nextState.level)) {
      state.level = nextState.level;
    }
    if (Number.isFinite(nextState.empireScore)) {
      state.empireScore = nextState.empireScore;
    }
  }

  function xpTarget() {
    return xpForLevelUp();
  }

  return {
    state,
    gainXP,
    addScore,
    set,
    xpTarget,
  };
}
