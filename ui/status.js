export function createStatusPanel({ root }) {
  let lastKey = null;

  function bar(label, value, className = "") {
    const pct = Math.max(0, Math.min(100, value));
    return `
      <div class="mini-meter ${className}">
        <span>${label}</span>
        <strong>${Math.round(value)}</strong>
        <div><i style="width: ${pct}%"></i></div>
      </div>
    `;
  }

  function render({ stamina, hunger, dayTime, eventName, eventTimer, region, coldTime }) {
    const isNight = dayTime < 0.22 || dayTime > 0.78;
    const coldPct = Math.min(100, (coldTime / 3600) * 100);
    const coldWarning = coldTime > 1800 ? "❄️ Freezing!" : coldTime > 900 ? "🧊 Cold" : "";
    const key = `${Math.round(stamina)},${Math.round(hunger)},${isNight},${eventName},${Math.ceil(eventTimer)},${region},${Math.round(coldTime)}`;
    if (lastKey === key) return;
    lastKey = key;
    root.innerHTML = `
      <h2>Survival</h2>
      <div class="status-grid">
        ${bar("Stamina", stamina, "stamina")}
        ${bar("Hunger", hunger, "hunger")}
        <div class="mini-meter temp">
          <span>Temp</span>
          <strong>${coldWarning || "Warm"}</strong>
          <div><i style="width: ${coldPct}%; background: ${coldPct > 50 ? '#cc4444' : coldPct > 25 ? '#ccaa44' : '#44aa88'}"></i></div>
        </div>
        <div class="status-row">
          <span>${isNight ? "Night" : "Day"}</span>
          <strong>${eventName}</strong>
        </div>
        <div class="status-row">
          <span>Event</span>
          <strong>${Math.ceil(eventTimer)}s</strong>
        </div>
        <div class="status-row">
          <span>Region</span>
          <strong>${region ?? "0,0"}</strong>
        </div>
      </div>
    `;
  }

  return { render };
}
