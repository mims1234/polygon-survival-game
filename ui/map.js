export function createMapOverlay({ root }) {
  let visible = false;
  let _visitedRegions = {};
  let _currentRegion = { x: 0, y: 0 };

  function render({ visitedRegions, currentRegion }) {
    _visitedRegions = visitedRegions;
    _currentRegion = currentRegion;
    if (visible) _draw();
  }

  function _draw() {
    const keys = Object.keys(_visitedRegions);
    if (keys.length === 0 && !_visitedRegions[`${_currentRegion.x},${_currentRegion.y}`]) {
      keys.push(`${_currentRegion.x},${_currentRegion.y}`);
    }

    const allXs = keys.map((k) => Number(k.split(",")[0]));
    const allYs = keys.map((k) => Number(k.split(",")[1]));
    // always include current
    allXs.push(_currentRegion.x);
    allYs.push(_currentRegion.y);

    const minX = Math.min(...allXs) - 1;
    const maxX = Math.max(...allXs) + 1;
    const minY = Math.min(...allYs) - 1;
    const maxY = Math.max(...allYs) + 1;

    const cols = maxX - minX + 1;
    const rows = maxY - minY + 1;

    const cellSize = Math.min(48, Math.floor(Math.min(480 / cols, 480 / rows)));

    const allKeys = new Set(keys);
    allKeys.add(`${_currentRegion.x},${_currentRegion.y}`);

    let cells = "";
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const key = `${x},${y}`;
        const isCurrent = x === _currentRegion.x && y === _currentRegion.y;
        const isVisited = allKeys.has(key);
        let cls = "map-cell";
        if (isCurrent) cls += " current";
        else if (isVisited) cls += " visited";

        const label = isCurrent ? `<span class="map-cell-label">★</span>` :
          isVisited ? `<span class="map-cell-label">${x},${y}</span>` : "";
        cells += `<div class="${cls}" style="width:${cellSize}px;height:${cellSize}px;">${label}</div>`;
      }
    }

    root.innerHTML = `
      <div class="map-overlay">
        <div class="map-card">
          <div class="map-header">
            <h2>World Map</h2>
            <span class="map-region-label">📍 ${_currentRegion.x}, ${_currentRegion.y}</span>
            <button class="map-close" id="map-close-btn">✕ Close [M]</button>
          </div>
          <div class="map-legend">
            <span class="map-legend-item current">★ Current</span>
            <span class="map-legend-item visited">■ Visited</span>
            <span class="map-legend-item unvisited">□ Unknown</span>
          </div>
          <div class="map-grid" style="grid-template-columns:repeat(${cols},${cellSize}px);grid-template-rows:repeat(${rows},${cellSize}px);">
            ${cells}
          </div>
          <p class="map-hint">Walk to the edge of a region to travel to the next one</p>
        </div>
      </div>
    `;

    root.querySelector("#map-close-btn")?.addEventListener("click", hide);
  }

  function show() {
    visible = true;
    _draw();
  }

  function hide() {
    visible = false;
    root.innerHTML = "";
  }

  function toggle() {
    if (visible) hide();
    else show();
  }

  return { render, show, hide, toggle, isVisible: () => visible };
}
