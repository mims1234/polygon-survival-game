import * as THREE from "three";
import { createSceneRenderer } from "./renderer/scene.js";
import { createPostFX } from "./renderer/postfx.js";
import { createWorldGrid, worldToGrid } from "./world/grid.js";
import { createResourceSystem } from "./world/resources.js";
import { createPlayer } from "./character/player.js";
import { createInventory } from "./systems/inventory.js";
import { createProgression } from "./systems/progression.js";
import { createRaycastSystem } from "./systems/raycaster.js";
import { createToolbar } from "./ui/toolbar.js";
import { createBuildMenu } from "./ui/buildmenu.js";
import { createHUD } from "./ui/hud.js";
import { createOverlay } from "./ui/overlay.js";
import { isBuildTool, TOOL_LABELS } from "./character/tools.js";
import { createSpriteSystem } from "./renderer/sprites.js";
import { createBuildingPlacer } from "./buildings/placer.js";
import { getBuildingById } from "./buildings/registry.js";
import { createTileHighlight } from "./systems/highlight.js";
import { createObjectiveSystem } from "./systems/objectives.js";
import { createSurvivalSystem } from "./systems/survival.js";
import { createSaveSystem } from "./systems/save.js";
import { createStatusPanel } from "./ui/status.js";
import { createInspector } from "./ui/inspector.js";
import { createObjectivePanel } from "./ui/objectives.js";
import { createCraftingPanel } from "./ui/crafting.js";
import { createMapOverlay } from "./ui/map.js";
import { AUTOMATION, RECIPES } from "./systems/crafting.js";

const canvas = document.querySelector("#game");
const resourceRoot = document.querySelector("#resource-bar");
const progressRoot = document.querySelector("#progress-bar");
const toolRoot = document.querySelector("#tool-panel");
const buildRoot = document.querySelector("#build-panel");
const overlayRoot = document.querySelector("#overlay-root");
const statusRoot = document.querySelector("#status-panel");
const inspectorRoot = document.querySelector("#inspector-panel");
const objectiveRoot = document.querySelector("#objective-panel");
const craftingRoot = document.querySelector("#crafting-panel");
const transitionRoot = document.querySelector("#region-transition");
const actionBar = document.querySelector("#action-bar");
const actionFill = document.querySelector(".action-fill");
const mapRoot = document.querySelector("#map-root");

const rendererBundle = createSceneRenderer({ canvas });
const { scene, camera, renderer, lights } = rendererBundle;
const postFX = createPostFX({ renderer, scene, camera });

let region = { x: 0, y: 0 };
let grid = createWorldGrid({ scene, size: 20, seed: 17 });
let resources = createResourceSystem({ scene, grid });
const player = createPlayer({ scene, grid });
const inventory = createInventory();
const progression = createProgression();
const sprites = createSpriteSystem({ scene });
let buildings = createBuildingPlacer({ scene, grid });
const raycast = createRaycastSystem({ camera, canvas, target: grid.mesh });
const highlight = createTileHighlight({ scene });
const survival = createSurvivalSystem();
const saveSystem = createSaveSystem();

const hud = createHUD({ resourceRoot, progressRoot });
const overlay = createOverlay(overlayRoot);
const statusPanel = createStatusPanel({ root: statusRoot });
const inspector = createInspector({
  root: inspectorRoot,
  onUpgradeBuilding: (upgradeId) => upgradeSelectedBuilding(upgradeId),
});
const objectivePanel = createObjectivePanel({ root: objectiveRoot });
const craftingPanel = createCraftingPanel({
  root: craftingRoot,
  onCraft: (recipeId) => craft(recipeId),
});
const mapOverlay = createMapOverlay({ root: mapRoot });

const state = {
  activeTool: "hand",
  activeBuildingId: "campfire",
  winShown: false,
  selectedTileIndex: null,
  hoverTileIndex: null,
  queuedAction: null,
  actionProgress: 0,
  upgradedTools: {
    axe: 1,
    pickaxe: 1,
    bucket: 1,
    hand: 1,
  },
  lastSave: 0,
  transition: 0,
  travelCooldown: 0,
  automationElapsed: {},
  visitedRegions: {},
};

const toolbar = createToolbar({
  root: toolRoot,
  onSelect: (toolId) => {
    state.activeTool = toolId;
    renderUI();
  },
  onUpgrade: () => {
    const hasForge = hasBuilding("forge") || hasBuilding("blastfurnace");
    if (!hasForge) {
      sprites.spawn("Need Forge", player.root.position);
      return;
    }

    const tier2Costs = {
      axe: { wood: 5, stone: 6 },
      pickaxe: { wood: 4, stone: 8 },
      bucket: { wood: 4, stone: 4, water: 2 },
      hand: { food: 4, water: 2 },
    };

    const tier3Costs = {
      axe: { ingots: 3, planks: 6, coins: 4 },
      pickaxe: { ingots: 4, planks: 4, coins: 4 },
      bucket: { ingots: 2, planks: 4, coins: 3 },
      hand: { ingots: 2, food: 4, coins: 3 },
    };

    const hasBlastFurnace = hasBuilding("blastfurnace");
    const nextTier2 = Object.keys(tier2Costs).find((tool) => state.upgradedTools[tool] === 1);
    const nextTier3 = hasBlastFurnace ? Object.keys(tier3Costs).find((tool) => state.upgradedTools[tool] === 2) : null;

    const nextTool = nextTier2 ?? nextTier3;
    if (!nextTool) {
      sprites.spawn("Tools maxed", player.root.position);
      return;
    }

    const costs = state.upgradedTools[nextTool] === 1 ? tier2Costs[nextTool] : tier3Costs[nextTool];
    if (!inventory.spend(costs)) {
      sprites.spawn("Need resources", player.root.position);
      return;
    }

    state.upgradedTools[nextTool] += 1;
    progression.gainXP(state.upgradedTools[nextTool] === 2 ? 25 : 40);
    const tierLabel = state.upgradedTools[nextTool] === 2 ? "II" : "III";
    sprites.spawn(`${TOOL_LABELS[nextTool]} ${tierLabel}`, player.root.position);
    checkObjectives();
    renderUI();
  },
});

const buildMenu = createBuildMenu({
  root: buildRoot,
  onSelect: (buildingId) => {
    state.activeBuildingId = buildingId;
    state.activeTool = "build";
    renderUI();
  },
  onTrade: () => {
    const canTrade = hasBuilding("market") || hasBuilding("tradehub");
    if (!canTrade) {
      sprites.spawn("Need Market", player.root.position);
      return;
    }
    const isHub = hasBuilding("tradehub");
    const cost = isHub ? { food: 4, water: 2 } : { food: 5, water: 3 };
    if (!inventory.spend(cost)) {
      sprites.spawn("Need trade goods", player.root.position);
      return;
    }
    inventory.add("wood", isHub ? 3 : 2);
    inventory.add("stone", isHub ? 3 : 2);
    sprites.spawn("Trade complete", player.root.position);
    renderUI();
  },
});

let objectives = createObjectives();

function createObjectives() {
  return createObjectiveSystem({
    inventory,
    progression,
    buildings,
    onReward: (objective) => {
      sprites.spawn(`Goal: ${objective.label}`, player.root.position);
    },
  });
}

function hasBuilding(id) {
  return buildings.buildings.some((building) => building.id === id);
}

function getBuildingOnTile(tile) {
  return buildings.buildings.find((building) => building.tileIndex === tile?.index) ?? null;
}

function canAffordUpgrade(buildingRecord) {
  const def = buildingRecord?.definition?.upgrade;
  if (!def) return false;
  return inventory.canAfford(def.cost);
}

function upgradeSelectedBuilding(upgradeId) {
  const selectedTile = state.selectedTileIndex == null ? null : grid.tiles[state.selectedTileIndex];
  const buildingRecord = getBuildingOnTile(selectedTile);
  if (!buildingRecord || !buildingRecord.definition?.upgrade) return;
  const upgrade = buildingRecord.definition.upgrade;
  if (upgrade.to !== upgradeId) return;
  if (!inventory.spend(upgrade.cost)) {
    sprites.spawn("Need resources", player.root.position);
    return;
  }

  const passiveElapsed = buildingRecord.passiveElapsed;
  const tile = grid.tiles[buildingRecord.tileIndex];
  buildings.remove(buildingRecord);
  const newRecord = buildings.place(upgrade.to, tile);
  if (newRecord) {
    newRecord.progress = 1;
    newRecord.passiveElapsed = passiveElapsed;
    newRecord.mesh.scale.setScalar(1);
    progression.gainXP(20);
    progression.addScore(10);
    sprites.spawn(`${newRecord.name} upgraded`, tile.world);
    objectives.markUpgrade();
    checkObjectives();
    renderUI();
  }
}

function storageFromBuildings() {
  return buildings.buildings.reduce((total, building) => total + (building.definition.storageBonus ?? 0), 10);
}

function renderUI() {
  inventory.state.capacity = storageFromBuildings();
  hud.renderResources(inventory.snapshot());
  hud.renderProgress({
    level: progression.state.level,
    xp: progression.state.xp,
    xpTarget: progression.xpTarget(),
    empireScore: progression.state.empireScore,
  });
  toolbar.render({
    activeTool: state.activeTool,
    upgradedTools: state.upgradedTools,
    forgeBuilt: hasBuilding("forge"),
    blastFurnaceBuilt: hasBuilding("blastfurnace"),
  });
  const buildingCounts = {};
  for (const b of buildings.buildings) {
    buildingCounts[b.id] = (buildingCounts[b.id] ?? 0) + 1;
  }
  buildMenu.render({
    activeBuildingId: state.activeBuildingId,
    inventory: inventory.snapshot(),
    level: progression.state.level,
    canTrade: hasBuilding("market") || hasBuilding("tradehub"),
    isTradeHub: hasBuilding("tradehub"),
    counts: buildingCounts,
  });
  buildRoot.hidden = state.activeTool !== "build";
  statusPanel.render({ ...survival.state, region: regionKey() });
  objectivePanel.render(objectives.list());
  craftingPanel.render({
    inventory: inventory.snapshot(),
    hasBuilding,
  });

  const selectedTile = state.selectedTileIndex == null ? null : grid.tiles[state.selectedTileIndex];
  const selectedBuilding = getBuildingOnTile(selectedTile);
  const canUpgrade = selectedBuilding && selectedBuilding.definition?.upgrade && canAffordUpgrade(selectedBuilding);
  inspector.render({
    tile: selectedTile,
    resource: selectedTile ? resources.getByTileIndex(selectedTile.index) : null,
    building: selectedBuilding,
    activeTool: TOOL_LABELS[state.activeTool] ?? state.activeTool,
    canUpgrade,
  });

  mapOverlay.render({
    visitedRegions: state.visitedRegions,
    currentRegion: region,
  });
}

function regionKey(coords = region) {
  return `${coords.x},${coords.y}`;
}

function regionSeed(coords = region) {
  return 17 + coords.x * 92821 + coords.y * 68917;
}

function snapshotRegion() {
  return {
    discovered: grid.discoveredSnapshot(),
    collectedResources: resources.snapshot(),
    buildings: buildings.snapshot(),
  };
}

function saveCurrentRegionTo(data) {
  data.regions ??= {};
  data.regions[regionKey()] = snapshotRegion();
}

function rebuildRegion(nextRegion, entryEdge = null, savedRegion = null) {
  resources.dispose();
  buildings.dispose();
  grid.dispose();

  region = { ...nextRegion };
  grid = createWorldGrid({ scene, size: 20, seed: regionSeed(region) });
  resources = createResourceSystem({ scene, grid });
  buildings = createBuildingPlacer({ scene, grid });
  objectives = createObjectives();
  raycast.setTarget(grid.mesh);

  if (savedRegion) {
    grid.applyDiscovered(savedRegion.discovered);
    resources.setCollected(savedRegion.collectedResources);
    buildings.restore(savedRegion.buildings);
  }

  let spawnX = Math.floor(grid.size / 2);
  let spawnY = Math.floor(grid.size / 2);
  if (entryEdge === "east") spawnX = grid.size - 2;
  if (entryEdge === "west") spawnX = 1;
  if (entryEdge === "south") spawnY = grid.size - 2;
  if (entryEdge === "north") spawnY = 1;

  const spawnTile = grid.getTile(spawnX, spawnY);
  player.root.position.copy(spawnTile.world).add(new THREE.Vector3(0, 0.2, 0));
  player.moveToTile(spawnTile);
  state.selectedTileIndex = null;
  state.queuedAction = null;
  highlight.setHover(null);
  highlight.setSelected(null);
  grid.reveal(spawnX, spawnY, 3, 1);
  resources.updateVisibility();
  checkObjectives();
  renderUI();
}

function travelTo(direction) {
  const data = collectSaveData();
  saveCurrentRegionTo(data);

  // Mark current region as visited before leaving
  state.visitedRegions[regionKey()] = true;

  const next = { ...region };
  const entry = { east: "west", west: "east", north: "south", south: "north" }[direction];
  if (direction === "east") next.x += 1;
  if (direction === "west") next.x -= 1;
  if (direction === "south") next.y += 1;
  if (direction === "north") next.y -= 1;

  state.transition = 1;
  // Apply a cooldown so the player doesn't immediately re-trigger travel
  // after spawning near the entry edge in the new region
  state.travelCooldown = 1.2;
  transitionRoot.classList.add("active");
  saveSystem.save(data);
  setTimeout(() => {
    const fresh = saveSystem.load() ?? data;
    const wasVisited = state.visitedRegions[regionKey(next)];
    rebuildRegion(next, entry, fresh.regions?.[regionKey(next)]);
    // Mark the new region as visited
    state.visitedRegions[regionKey(next)] = true;
    state.transition = 0;
    transitionRoot.classList.remove("active");
    saveGame();
    sprites.spawn(`Region ${next.x},${next.y}`, player.root.position);
    if (!wasVisited) {
      progression.gainXP(30);
      sprites.spawn("+30 XP New Region!", player.root.position);
      objectives.markExplore();
      checkObjectives();
    }
  }, 260);
}

function revealAroundPlayer() {
  const pos = player.getGridPosition();
  grid.reveal(pos.x, pos.y, 2, 1);
  for (const building of buildings.buildings) {
    if (building.definition.revealRadius) {
      const tile = grid.tiles[building.tileIndex];
      grid.reveal(tile.x, tile.y, building.definition.revealRadius, 1);
    }
  }
  resources.updateVisibility();
}

function tryGather(tile) {
  const resourceNode = resources.getByTileIndex(tile.index);
  const event = survival.currentEvent();
  const tier = state.upgradedTools[state.activeTool] ?? 1;
  const yieldAmount = tier;
  const staminaCost = state.activeTool === "hand"
    ? (tier === 3 ? 2 : tier === 2 ? 3 : 5)
    : (tier === 3 ? 3 : tier === 2 ? 4 : 7);

  if (resourceNode) {
    if (resourceNode.tool !== state.activeTool) {
      sprites.spawn(`Need ${TOOL_LABELS[resourceNode.tool]}`, tile.world);
      return false;
    }

    resources.collect(resourceNode);
    const bonus = resourceNode.kind === "food" ? (event.berryBonus ?? 0) : 0;
    const gained = inventory.add(resourceNode.kind, yieldAmount + bonus);
    if (gained === 0) {
      sprites.spawn("Storage full!", tile.world);
    } else {
      sprites.spawn(`+${gained} ${resourceNode.kind}`, tile.world);
    }
    progression.gainXP(8);
    survival.spendStamina(staminaCost);
    checkObjectives();
    renderUI();
    return true;
  }

  if (tile.type === "water" && state.activeTool === "bucket") {
    const gained = inventory.add("water", yieldAmount + (event.waterBonus ?? 0));
    if (gained === 0) {
      sprites.spawn("Storage full!", tile.world);
    } else {
      sprites.spawn(`+${gained} water`, tile.world);
    }
    progression.gainXP(8);
    survival.spendStamina(tier === 3 ? 2 : tier === 2 ? 3 : 5);
    checkObjectives();
    renderUI();
    return true;
  }

  if (tile.type === "water" && state.activeTool !== "bucket") {
    sprites.spawn("Need Bucket", tile.world);
  }

  return false;
}

function craft(recipeId) {
  const recipe = RECIPES.find((item) => item.id === recipeId);
  if (!recipe) {
    return;
  }
  if (recipe.needs && !hasBuilding(recipe.needs)) {
    sprites.spawn(`Need ${recipe.needs}`, player.root.position);
    return;
  }
  if (!inventory.spend(recipe.cost)) {
    sprites.spawn("Need materials", player.root.position);
    return;
  }
  for (const [resource, amount] of Object.entries(recipe.gain)) {
    inventory.add(resource, amount);
  }
  progression.gainXP(12);
  sprites.spawn(recipe.name, player.root.position);
  checkObjectives();
  renderUI();
}

function tryBuild(tile) {
  const definition = getBuildingById(state.activeBuildingId);
  if (!definition) {
    return false;
  }

  if (progression.state.level < definition.unlockLevel) {
    sprites.spawn(`Need Lv ${definition.unlockLevel}`, tile.world);
    return false;
  }

  const playerTile = player.getGridPosition();
  if (playerTile.x === tile.x && playerTile.y === tile.y) {
    sprites.spawn("Move first", tile.world);
    return false;
  }

  if (!buildings.canPlace(tile)) {
    sprites.spawn("Blocked", tile.world);
    return false;
  }

  if (!inventory.spend(definition.cost)) {
    sprites.spawn("Need resources", tile.world);
    return false;
  }

  const placed = buildings.place(definition.id, tile);
  if (!placed) {
    Object.entries(definition.cost).forEach(([key, value]) => inventory.add(key, value));
    return false;
  }

  progression.gainXP(25);
  progression.addScore(definition.score);
  sprites.spawn(`${definition.name} built`, tile.world);
  survival.spendStamina(10);

  if (definition.revealRadius) {
    grid.reveal(tile.x, tile.y, definition.revealRadius, 1);
  }

  if (definition.winCondition && !state.winShown) {
    state.winShown = true;
    overlay.showWin({
      level: progression.state.level,
      empireScore: progression.state.empireScore,
      onContinue: () => {
        state.winShown = false;
      },
    });
  }

  checkObjectives();
  renderUI();
  return true;
}

function actionDuration(tile) {
  if (isBuildTool(state.activeTool)) {
    return 0.65;
  }
  const tier = state.upgradedTools[state.activeTool] ?? 1;
  const base = state.activeTool === "hand" ? 0.65 : 0.9;
  const speed = tier === 3 ? 0.35 : tier === 2 ? 0.58 : 1;
  return survival.state.stamina < 25 ? base * 1.55 : base * speed;
}

function findAdjacentWalkable(targetTile) {
  const dirs = [
    [0, -1], [0, 1], [-1, 0], [1, 0],
    [-1, -1], [1, -1], [-1, 1], [1, 1],
  ];
  let best = null;
  for (const [dx, dy] of dirs) {
    const t = grid.getTile(targetTile.x + dx, targetTile.y + dy);
    if (!t) continue;
    if (!t.buildable) continue;
    if (t.buildingId) continue;
    if (!best) best = t;
    if (!t.resourceNodeId) return t;
  }
  return best;
}

function queueAction(tile) {
  state.selectedTileIndex = tile.index;
  highlight.setSelected(tile);

  if (isBuildTool(state.activeTool)) {
    const adjacent = findAdjacentWalkable(tile);
    if (adjacent) {
      player.moveToTile(adjacent);
    }
    state.queuedAction = { type: "build", tileIndex: tile.index, duration: actionDuration(tile) };
    return;
  }

  const didImmediateWater = tile.type === "water" && state.activeTool !== "bucket";
  state.queuedAction = { type: "gather", tileIndex: tile.index, duration: actionDuration(tile), didImmediateWater };
  if (tile.type !== "water") {
    player.moveToTile(tile);
  }
}

function updateQueuedAction(delta) {
  if (!state.queuedAction) {
    if (actionBar) actionBar.hidden = true;
    return;
  }

  const tile = grid.tiles[state.queuedAction.tileIndex];
  if (!tile) {
    state.queuedAction = null;
    state.actionProgress = 0;
    if (actionBar) actionBar.hidden = true;
    return;
  }

  const target = tile.world.clone();
  target.y = player.root.position.y;

  if (state.queuedAction.type === "build") {
    const playerTile = player.getGridPosition();
    const dx = Math.abs(playerTile.x - tile.x);
    const dy = Math.abs(playerTile.y - tile.y);
    const isAdjacent = dx <= 1 && dy <= 1 && (dx + dy) > 0;
    if (!isAdjacent) {
      if (actionBar) actionBar.hidden = true;
      return;
    }
  } else if (player.root.position.distanceTo(target) > 0.75 && tile.type !== "water") {
    if (actionBar) actionBar.hidden = true;
    return;
  }

  state.actionProgress += delta;
  if (actionBar && actionFill) {
    actionBar.hidden = false;
    const pct = Math.min(100, (state.actionProgress / state.queuedAction.duration) * 100);
    actionFill.style.width = `${pct}%`;
  }

  if (state.actionProgress < state.queuedAction.duration) {
    return;
  }

  if (state.queuedAction.type === "build") {
    tryBuild(tile);
  } else {
    tryGather(tile);
  }

  state.queuedAction = null;
  state.actionProgress = 0;
  if (actionBar) actionBar.hidden = true;
}

canvas.addEventListener("click", (event) => {
  const instanceId = raycast.pickTile(event);
  if (instanceId == null) {
    return;
  }

  const tile = grid.tiles[instanceId];
  if (!tile || !tile.discovered) {
    return;
  }

  queueAction(tile);
});

canvas.addEventListener("pointermove", (event) => {
  const instanceId = raycast.pickTile(event);
  state.hoverTileIndex = instanceId;
  const tile = instanceId == null ? null : grid.tiles[instanceId];
  highlight.setHover(tile);
});

window.addEventListener("keydown", (event) => {
  if (state.transition > 0 || state.winShown) return;
  const keyMap = { "1": "hand", "2": "axe", "3": "pickaxe", "4": "bucket", "5": "build" };
  const toolId = keyMap[event.key];
  if (toolId) {
    state.activeTool = toolId;
    if (toolId === "build") {
      state.activeBuildingId = state.activeBuildingId || "campfire";
    }
    renderUI();
  }
});

window.addEventListener("keydown", (e) => {
  if (e.key === "m" || e.key === "M") {
    mapOverlay.toggle();
  }
  if (e.key === "h" || e.key === "H") {
    window.location.href = "help.html";
  }
  if (e.key === "Escape" && mapOverlay.isVisible()) {
    mapOverlay.hide();
  }
});

document.getElementById("map-hint-btn")?.addEventListener("click", () => mapOverlay.toggle());
document.getElementById("help-hint-btn")?.addEventListener("click", () => {
  window.location.href = "help.html";
});
document.getElementById("info-rail-toggle")?.addEventListener("click", () => {
  document.querySelector(".info-rail")?.classList.toggle("open");
});

const resetBtn = document.getElementById("reset-button");
const resetConfirmBtn = document.getElementById("reset-confirm-button");
const resetCancelBtn = document.getElementById("reset-cancel-button");
resetBtn?.addEventListener("click", () => {
  resetBtn.hidden = true;
  resetConfirmBtn.hidden = false;
  resetCancelBtn.hidden = false;
});
resetConfirmBtn?.addEventListener("click", () => {
  localStorage.removeItem("wildlands-save-v2");
  location.reload();
});
resetCancelBtn?.addEventListener("click", () => {
  resetCancelBtn.hidden = true;
  resetConfirmBtn.hidden = true;
  resetBtn.hidden = false;
});


function checkObjectives() {
  objectives.update();
  renderUI();
}

function applySave() {
  const saved = saveSystem.load();
  if (!saved) {
    return;
  }
  inventory.set(saved.inventory);
  progression.set(saved.progression);
  survival.set(saved.survival);
  objectives.set(saved.objectives ?? []);
  resources.setCollected(saved.collectedResources);
  buildings.restore(saved.buildings);
  if (saved.region) {
    rebuildRegion(saved.region, null, saved.regions?.[regionKey(saved.region)]);
  }
  // Migrate old boolean tool upgrades to numeric tiers
  const migratedTools = saved.upgradedTools ?? {};
  for (const tool of Object.keys(state.upgradedTools)) {
    if (typeof migratedTools[tool] === "boolean") {
      state.upgradedTools[tool] = migratedTools[tool] ? 2 : 1;
    } else if (typeof migratedTools[tool] === "number") {
      state.upgradedTools[tool] = migratedTools[tool];
    }
  }
  Object.assign(state.automationElapsed, saved.automationElapsed ?? {});
  Object.assign(state.visitedRegions, saved.visitedRegions ?? {});
  // Mark the loaded region as visited
  if (saved.region) {
    state.visitedRegions[regionKey(saved.region)] = true;
  }
}

function collectSaveData() {
  const existing = saveSystem.load() ?? {};
  const data = {
    ...existing,
    inventory: inventory.snapshot(),
    progression: { ...progression.state },
    survival: survival.snapshot(),
    objectives: objectives.snapshot(),
    region: { ...region },
    regions: { ...(existing.regions ?? {}) },
    upgradedTools: { ...state.upgradedTools },
    automationElapsed: { ...state.automationElapsed },
    visitedRegions: { ...state.visitedRegions },
  };
  saveCurrentRegionTo(data);
  return data;
}

function saveGame() {
  saveSystem.save(collectSaveData());
}

grid.reveal(Math.floor(grid.size / 2), Math.floor(grid.size / 2), 3, 1);
applySave();
resources.updateVisibility();
checkObjectives();
renderUI();

const clock = new THREE.Clock();

function updatePassive(delta) {
  for (const building of buildings.buildings) {
    const passive = building.definition.passive;
    if (!passive) {
      continue;
    }

    building.passiveElapsed += delta;
    const event = survival.currentEvent();
    let speed = event.farmSpeed ?? 1;

    if (building.passiveElapsed >= passive.every * speed) {
      // Farms require water to produce
      if (building.id === "farm") {
        if (inventory.state.water <= 0) {
          building.passiveElapsed = passive.every * speed;
          continue;
        }
        inventory.spend({ water: 1 });
      }

      building.passiveElapsed -= passive.every * speed;
      for (const [resource, amount] of Object.entries(passive.gain)) {
        const gained = inventory.add(resource, amount);
        sprites.spawn(`+${gained} ${resource}`, grid.tiles[building.tileIndex].world);
      }
      checkObjectives();
      renderUI();
    }
  }
}

function updateAutomation(delta) {
  for (const item of AUTOMATION) {
    if (!hasBuilding(item.building)) {
      continue;
    }
    state.automationElapsed[item.building] = (state.automationElapsed[item.building] ?? 0) + delta;
    if (state.automationElapsed[item.building] < item.every) {
      continue;
    }
    state.automationElapsed[item.building] -= item.every;
    if (item.cost && !inventory.spend(item.cost)) {
      continue;
    }
    for (const [resource, amount] of Object.entries(item.gain)) {
      inventory.add(resource, amount);
    }
    sprites.spawn(`Auto ${Object.keys(item.gain)[0]}`, player.root.position);
    checkObjectives();
    renderUI();
  }
}

function updateSurvival(delta) {
  const playerTile = player.getGridPosition();
  const nearCampfire = buildings.buildings.some((building) => {
    if (building.id !== "campfire" && building.id !== "bonfire") {
      return false;
    }
    const radius = building.id === "bonfire" ? 5 : 3;
    const tile = grid.tiles[building.tileIndex];
    return Math.hypot(tile.x - playerTile.x, tile.y - playerTile.y) <= radius;
  });

  const nearBonfire = buildings.buildings.some((building) => {
    if (building.id !== "bonfire") return false;
    const tile = grid.tiles[building.tileIndex];
    return Math.hypot(tile.x - playerTile.x, tile.y - playerTile.y) <= 5;
  });

  const newEvent = survival.update(delta, {
    nearCampfire,
    nearBonfire,
    shelter: hasBuilding("shelter") || hasBuilding("cabin"),
  });

  if (survival.state.hunger < 55 && inventory.state.food > 0) {
    inventory.spend({ food: 1 });
    survival.eat(1);
    sprites.spawn("Ate food", player.root.position);
  }

  if (newEvent) {
    sprites.spawn(newEvent.name, player.root.position);
  }

  // Freezing death
  if (survival.isFrozen()) {
    sprites.spawn("FROZEN TO DEATH", player.root.position);
    // Reset player to starting position with penalties
    const spawnTile = grid.getTile(Math.floor(grid.size / 2), Math.floor(grid.size / 2));
    player.root.position.copy(spawnTile.world).add(new THREE.Vector3(0, 0.2, 0));
    player.moveToTile(spawnTile);
    survival.state.stamina = 30;
    survival.state.hunger = 40;
    survival.state.coldTime = 0;
    inventory.state.wood = Math.max(0, inventory.state.wood - 5);
    inventory.state.stone = Math.max(0, inventory.state.stone - 3);
  }

  const nightAmount = Math.max(
    0,
    survival.state.dayTime < 0.28
      ? (0.28 - survival.state.dayTime) / 0.28
      : survival.state.dayTime > 0.72
        ? (survival.state.dayTime - 0.72) / 0.28
        : 0,
  );
  const smoothNight = THREE.MathUtils.smoothstep(nightAmount, 0, 1);
  scene.background.set(0xa8dcf7).lerp(new THREE.Color(0x7f8f9a), smoothNight);
  lights.sun.intensity = THREE.MathUtils.lerp(1.8, 0.55, smoothNight);
  lights.hemi.intensity = THREE.MathUtils.lerp(1.2, 0.65, smoothNight);
  lights.fill.intensity = THREE.MathUtils.lerp(0.45, 0.24, smoothNight);
  postFX.bloom.strength = THREE.MathUtils.lerp(0.3, 0.12, smoothNight);
}

function checkRegionTravel() {
  if (state.transition > 0 || state.travelCooldown > 0 || state.queuedAction) {
    return;
  }
  const pos = player.getGridPosition();
  if (pos.x <= 0) travelTo("west");
  else if (pos.x >= grid.size - 1) travelTo("east");
  else if (pos.y <= 0) travelTo("north");
  else if (pos.y >= grid.size - 1) travelTo("south");
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;

  // Tick down the travel cooldown each frame
  if (state.travelCooldown > 0) {
    state.travelCooldown = Math.max(0, state.travelCooldown - delta);
  }

  player.update(delta, elapsed);
  buildings.update(delta);
  resources.update(delta);
  sprites.update(delta);
  updateQueuedAction(delta);
  updateSurvival(delta);
  updatePassive(delta);
  updateAutomation(delta);
  revealAroundPlayer();
  checkRegionTravel();

  const playerTargetGrid = worldToGrid(player.root.position, grid.size);
  grid.reveal(playerTargetGrid.x, playerTargetGrid.y, 2, 1);

  state.lastSave += delta;
  if (state.lastSave >= 5) {
    state.lastSave = 0;
    saveGame();
  }

  postFX.render();
}

animate();
