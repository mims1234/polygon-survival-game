import * as THREE from "three";
import { TILE_COLORS, biomeAt } from "./biomes.js";

const TILE_SIZE = 1;
const FOG_DIM = 0.72;
const FOG_TINT = new THREE.Color(0x35534a);

export function gridToWorld(x, y, size) {
  return new THREE.Vector3(x - size / 2 + 0.5, 0, y - size / 2 + 0.5);
}

export function worldToGrid(position, size) {
  return {
    x: Math.floor(position.x + size / 2),
    y: Math.floor(position.z + size / 2),
  };
}

export function createWorldGrid({ scene, size = 20, seed = 17 }) {
  const geometry = new THREE.BoxGeometry(TILE_SIZE, 0.22, TILE_SIZE);
  const material = new THREE.MeshToonMaterial({
    color: 0xffffff,
    vertexColors: false,
    emissive: 0x243b34,
    emissiveIntensity: 0.18,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, size * size);
  mesh.castShadow = false;
  mesh.receiveShadow = false;

  const color = new THREE.Color();
  const matrix = new THREE.Matrix4();
  const tiles = [];

  let index = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const type = biomeAt(x, y, size, seed);
      const position = gridToWorld(x, y, size);
      matrix.makeTranslation(position.x, -0.11, position.z);
      mesh.setMatrixAt(index, matrix);

      // Unexplored tiles start as a solid dark shadow cloud
      color.setHex(0x0c1417);
      mesh.setColorAt(index, color);

      tiles.push({
        index,
        x,
        y,
        type,
        world: position.clone(),
        discovered: false,
        buildable: type !== "water",
        resourceNodeId: null,
        buildingId: null,
      });

      index += 1;
    }
  }

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) {
    mesh.instanceColor.needsUpdate = true;
  }
  scene.add(mesh);

  function getTile(x, y) {
    if (x < 0 || y < 0 || x >= size || y >= size) {
      return null;
    }
    return tiles[y * size + x];
  }

  function reveal(cx, cy, radius, strength = 1) {
    const revealStrength = THREE.MathUtils.clamp(strength, 0, 1);
    let changed = false;
    for (let y = cy - radius; y <= cy + radius; y += 1) {
      for (let x = cx - radius; x <= cx + radius; x += 1) {
        const tile = getTile(x, y);
        if (!tile) {
          continue;
        }

        const dist = Math.hypot(tile.x - cx, tile.y - cy);
        if (dist > radius) {
          continue;
        }

        const wasDiscovered = tile.discovered;
        tile.discovered = true;
        const falloff = 1 - (dist / Math.max(radius, 1)) * 0.28 * (1 / revealStrength);
        const fogLevel = THREE.MathUtils.clamp(THREE.MathUtils.lerp(FOG_DIM, 1, falloff), FOG_DIM, 1);
        color.setHex(TILE_COLORS[tile.type]).multiplyScalar(fogLevel * 2.25).lerp(FOG_TINT, (1 - fogLevel) * 0.18);

        if (!wasDiscovered || tile._lastFogLevel == null || Math.abs(tile._lastFogLevel - fogLevel) > 0.001) {
          mesh.setColorAt(tile.index, color);
          tile._lastFogLevel = fogLevel;
          changed = true;
        }
      }
    }

    if (changed && mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }

  function applyDiscovered(discovered = []) {
    for (const index of discovered) {
      const tile = tiles[index];
      if (!tile) {
        continue;
      }
      tile.discovered = true;
      // Paint the tile as visited-but-unlit
      color.setHex(TILE_COLORS[tile.type]).multiplyScalar(FOG_DIM * 2.25).lerp(FOG_TINT, (1 - FOG_DIM) * 0.18);
      mesh.setColorAt(tile.index, color);
      tile._lastFogLevel = FOG_DIM;
    }
    if (discovered.length > 0 && mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }

  function discoveredSnapshot() {
    return tiles.filter((tile) => tile.discovered).map((tile) => tile.index);
  }

  function dispose() {
    scene.remove(mesh);
    geometry.dispose();
    material.dispose();
  }

  return {
    size,
    mesh,
    tiles,
    tileSize: TILE_SIZE,
    getTile,
    reveal,
    applyDiscovered,
    discoveredSnapshot,
    dispose,
  };
}
