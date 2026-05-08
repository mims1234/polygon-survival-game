import * as THREE from "three";
import { TILE_TYPES } from "./biomes.js";

function rand(seed) {
  const value = Math.sin(seed * 127.77) * 43758.5453;
  return value - Math.floor(value);
}

function makeToon(materialColor) {
  return new THREE.MeshToonMaterial({ color: materialColor });
}

function createTree() {
  const group = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.16, 0.7, 6),
    makeToon(0x6e4428),
  );
  trunk.position.y = 0.35;
  trunk.castShadow = true;
  trunk.receiveShadow = true;

  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 8, 8),
    makeToon(0x4f9248),
  );
  canopy.position.y = 0.9;
  canopy.scale.set(1, 0.85, 1);
  canopy.castShadow = true;
  canopy.receiveShadow = true;

  group.add(trunk, canopy);
  return group;
}

function createRock() {
  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.32, 0),
    makeToon(0x8a9098),
  );
  mesh.position.y = 0.22;
  mesh.scale.set(1.2, 0.8, 1);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createBush() {
  const group = new THREE.Group();
  const leaf = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 8, 8),
    makeToon(0x5eaa51),
  );
  leaf.position.set(0, 0.18, 0);
  leaf.scale.set(1.2, 0.9, 1.2);

  const berry = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 6, 6),
    makeToon(0xb83256),
  );
  berry.position.set(0.14, 0.2, 0.1);

  group.add(leaf, berry);
  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return group;
}

export function createResourceSystem({ scene, grid }) {
  let nextResourceId = 1;
  const nodes = [];

  for (const tile of grid.tiles) {
    const seed = tile.index + 1;

    if (tile.type === TILE_TYPES.FOREST && rand(seed) > 0.55) {
      const model = createTree();
      model.position.copy(tile.world).add(new THREE.Vector3(rand(seed * 2) * 0.24 - 0.12, 0, rand(seed * 3) * 0.24 - 0.12));
      model.visible = false;
      scene.add(model);
      const id = nextResourceId;
      nextResourceId += 1;
      nodes.push({
        id,
        kind: "wood",
        tool: "axe",
        tileIndex: tile.index,
        position: tile.world.clone(),
        mesh: model,
        collected: false,
        regrow: 360 + rand(seed * 7) * 140,
        regrowElapsed: 0,
      });
      tile.resourceNodeId = id;
      continue;
    }

    if (tile.type === TILE_TYPES.ROCK && rand(seed * 4) > 0.60) {
      const model = createRock();
      model.position.copy(tile.world).add(new THREE.Vector3(0.05, 0, -0.02));
      model.visible = false;
      scene.add(model);
      const id = nextResourceId;
      nextResourceId += 1;
      nodes.push({
        id,
        kind: "stone",
        tool: "pickaxe",
        tileIndex: tile.index,
        position: tile.world.clone(),
        mesh: model,
        collected: false,
        regrow: 420 + rand(seed * 8) * 180,
        regrowElapsed: 0,
      });
      tile.resourceNodeId = id;
      continue;
    }

    if (tile.type === TILE_TYPES.GRASS && rand(seed * 5) > 0.88) {
      const model = createBush();
      model.position.copy(tile.world).add(new THREE.Vector3(-0.08, 0, 0.03));
      model.visible = false;
      scene.add(model);
      const id = nextResourceId;
      nextResourceId += 1;
      nodes.push({
        id,
        kind: "food",
        tool: "hand",
        tileIndex: tile.index,
        position: tile.world.clone(),
        mesh: model,
        collected: false,
        regrow: 180 + rand(seed * 7) * 80,
        regrowElapsed: 0,
      });
      tile.resourceNodeId = id;
    }
  }

  function getByTileIndex(tileIndex) {
    return nodes.find((node) => node.tileIndex === tileIndex && !node.collected) || null;
  }

  function collect(node) {
    node.collected = true;
    scene.remove(node.mesh);
    const tile = grid.tiles[node.tileIndex];
    if (tile) {
      tile.resourceNodeId = null;
    }
  }

  function removeNodeVisual(node) {
    if (node.mesh.parent) {
      scene.remove(node.mesh);
    }
    node.collected = true;
    const tile = grid.tiles[node.tileIndex];
    if (tile) {
      tile.resourceNodeId = null;
    }
  }

  function revive(node) {
    node.mesh = createBush();
    node.mesh.position.copy(node.position).add(new THREE.Vector3(-0.08, 0, 0.03));
    node.mesh.visible = false;
    node.collected = false;
    node.regrowElapsed = 0;
    scene.add(node.mesh);
    const tile = grid.tiles[node.tileIndex];
    if (tile) {
      tile.resourceNodeId = node.id;
    }
  }

  function update(delta) {
    for (const node of nodes) {
      if (!node.collected || node.regrow == null) {
        continue;
      }
      node.regrowElapsed += delta;
      if (node.regrowElapsed >= node.regrow) {
        if (node.kind === "food") {
          revive(node);
        } else if (node.kind === "wood") {
          node.mesh = createTree();
          node.mesh.position.copy(node.position).add(new THREE.Vector3(rand(node.id * 2) * 0.24 - 0.12, 0, rand(node.id * 3) * 0.24 - 0.12));
          node.mesh.visible = false;
          node.collected = false;
          node.regrowElapsed = 0;
          scene.add(node.mesh);
          const tile = grid.tiles[node.tileIndex];
          if (tile) tile.resourceNodeId = node.id;
        } else if (node.kind === "stone") {
          node.mesh = createRock();
          node.mesh.position.copy(node.position).add(new THREE.Vector3(0.05, 0, -0.02));
          node.mesh.visible = false;
          node.collected = false;
          node.regrowElapsed = 0;
          scene.add(node.mesh);
          const tile = grid.tiles[node.tileIndex];
          if (tile) tile.resourceNodeId = node.id;
        }
      }
    }
  }

  function setCollected(ids = []) {
    const collected = new Set(ids);
    for (const node of nodes) {
      if (collected.has(node.id)) {
        removeNodeVisual(node);
      }
    }
  }

  function snapshot() {
    return nodes
      .filter((node) => node.collected)
      .map((node) => node.id);
  }

  function dispose() {
    for (const node of nodes) {
      if (node.mesh.parent) {
        scene.remove(node.mesh);
      }
      node.mesh.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m?.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    }
    nodes.length = 0;
  }

  function updateVisibility() {
    for (const node of nodes) {
      const tile = grid.tiles[node.tileIndex];
      node.mesh.visible = Boolean(tile?.discovered && !node.collected);
    }
  }

  return {
    nodes,
    getByTileIndex,
    collect,
    update,
    updateVisibility,
    setCollected,
    snapshot,
    dispose,
  };
}
