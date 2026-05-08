const SAVE_KEY = "wildlands-save-v3";

export function createSaveSystem() {
  function load() {
    try {
      return JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null");
    } catch {
      return null;
    }
  }

  function save(data) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  function clear() {
    localStorage.removeItem(SAVE_KEY);
  }

  return {
    load,
    save,
    clear,
  };
}
