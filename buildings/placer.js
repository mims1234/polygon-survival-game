import * as THREE from "three";
import { getBuildingById } from "./registry.js";

let nextBuildingId = 1;

const _materialCache = new Map();

function material(color) {
  if (!_materialCache.has(color)) {
    _materialCache.set(color, new THREE.MeshToonMaterial({ color }));
  }
  return _materialCache.get(color);
}

function createBuildingModel(definition) {
  const group = new THREE.Group();

  if (definition.id === "campfire") {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 0.12, 8), material(0x5f4635));
    base.position.y = 0.06;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 8), material(0xffaa3d));
    flame.position.y = 0.3;
    group.add(base, flame);
  } else if (definition.id === "shelter") {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.15, 0.9), material(0x8e6b45));
    floor.position.y = 0.08;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.55, 4), material(0xc07c4a));
    roof.position.y = 0.55;
    roof.rotation.y = Math.PI * 0.25;
    group.add(floor, roof);
  } else if (definition.id === "farm") {
    const plot = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.9), material(0x7e5b32));
    plot.position.y = 0.04;
    const crop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.26, 0.7), material(0x8cbc58));
    crop.position.y = 0.2;
    group.add(plot, crop);
  } else if (definition.id === "watchtower") {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, 0.35), material(0x92724a));
    tower.position.y = 0.6;
    const platform = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.14, 0.8), material(0xb4936b));
    platform.position.y = 1.2;
    group.add(tower, platform);
  } else if (definition.id === "lumbercamp") {
    const shed = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.45, 0.55), material(0x9a7448));
    shed.position.y = 0.24;
    const logs = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.75, 8), material(0x6e4428));
    logs.position.set(0.1, 0.12, 0.34);
    logs.rotation.z = Math.PI / 2;
    group.add(shed, logs);
  } else if (definition.id === "quarry") {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.2, 0.85), material(0x6e747b));
    base.position.y = 0.1;
    const crane = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.9, 0.16), material(0x8a6a45));
    crane.position.y = 0.5;
    group.add(base, crane);
  } else if (definition.id === "well") {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.35, 10), material(0x7c838a));
    ring.position.y = 0.18;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.32, 4), material(0xb66d4f));
    roof.position.y = 0.62;
    roof.rotation.y = Math.PI * 0.25;
    group.add(ring, roof);
  } else if (definition.id === "forge") {
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.65, 0.8), material(0x696f79));
    block.position.y = 0.32;
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 0.22), material(0x555c65));
    chimney.position.set(0.22, 0.68, -0.18);
    group.add(block, chimney);
  } else if (definition.id === "workshop") {
    const hut = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.62, 0.82), material(0xb68b58));
    hut.position.y = 0.31;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.18, 0.95), material(0x6f7f72));
    roof.position.y = 0.72;
    group.add(hut, roof);
  } else if (definition.id === "market") {
    const hall = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.8, 1.15), material(0xcaa26e));
    hall.position.y = 0.4;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.96, 0.65, 4), material(0xca6b49));
    roof.position.y = 1.12;
    roof.rotation.y = Math.PI * 0.25;
    group.add(hall, roof);
  } else if (definition.id === "bonfire") {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.45, 0.14, 8), material(0x5f4635));
    base.position.y = 0.07;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.48, 8), material(0xff7733));
    flame.position.y = 0.4;
    const flame2 = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 8), material(0xffaa3d));
    flame2.position.y = 0.52;
    group.add(base, flame, flame2);
  } else if (definition.id === "cabin") {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.18, 1.1), material(0x8e6b45));
    floor.position.y = 0.09;
    const walls = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.65, 1.0), material(0x9e7b55));
    walls.position.y = 0.5;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.7, 4), material(0xc07c4a));
    roof.position.y = 1.08;
    roof.rotation.y = Math.PI * 0.25;
    group.add(floor, walls, roof);
  } else if (definition.id === "irrigatedfarm") {
    const plot = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.9), material(0x6e5b32));
    plot.position.y = 0.04;
    const crop = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.32, 0.75), material(0x7cbc48));
    crop.position.y = 0.24;
    const ditch = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.04, 0.95), material(0x4c95d9));
    ditch.position.y = 0.02;
    group.add(plot, crop, ditch);
  } else if (definition.id === "sawmill") {
    const shed = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.7), material(0x8a6440));
    shed.position.y = 0.28;
    const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 8), material(0x7c838a));
    blade.position.set(0, 0.12, 0.4);
    blade.rotation.x = Math.PI / 2;
    group.add(shed, blade);
  } else if (definition.id === "deepquarry") {
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.28, 0.95), material(0x5e646b));
    base.position.y = 0.14;
    const crane = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.1, 0.18), material(0x8a6a45));
    crane.position.y = 0.6;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.08), material(0x7a5a35));
    arm.position.set(0.3, 1.0, 0);
    group.add(base, crane, arm);
  } else if (definition.id === "deepwell") {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.45, 10), material(0x6c737a));
    ring.position.y = 0.22;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.4, 4), material(0xa65d3f));
    roof.position.y = 0.72;
    roof.rotation.y = Math.PI * 0.25;
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.14, 6), material(0x8a6a45));
    bucket.position.set(0.3, 0.5, 0);
    group.add(ring, roof, bucket);
  } else if (definition.id === "blastfurnace") {
    const block = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.85, 0.95), material(0x595f69));
    block.position.y = 0.42;
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.95, 0.28), material(0x454c55));
    chimney.position.set(0.26, 0.82, -0.22);
    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.05), material(0xff7733));
    glow.position.set(0, 0.35, 0.48);
    group.add(block, chimney, glow);
  } else if (definition.id === "factory") {
    const hut = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.72, 0.95), material(0xa67b48));
    hut.position.y = 0.36;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.1), material(0x5f7f62));
    roof.position.y = 0.82;
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.4, 0.14), material(0x7c838a));
    chimney.position.set(0.35, 0.92, -0.2);
    group.add(hut, roof, chimney);
  } else if (definition.id === "tradehub") {
    const hall = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.95, 1.35), material(0xba9260));
    hall.position.y = 0.48;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.75, 4), material(0xba5b39));
    roof.position.y = 1.32;
    roof.rotation.y = Math.PI * 0.25;
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.55, 0.04), material(0x8a6a45));
    flag.position.set(0.6, 1.55, 0.6);
    const flagCloth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.04), material(0xcc4444));
    flagCloth.position.set(0.48, 1.7, 0.6);
    group.add(hall, roof, flag, flagCloth);
  } else {
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.55, 0.75), material(0x9c9f72));
    block.position.y = 0.28;
    group.add(block);
  }

  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return group;
}

export function createBuildingPlacer({ scene, grid }) {
  const buildings = [];

  function canPlace(tile) {
    return Boolean(tile && tile.buildable && !tile.buildingId && !tile.resourceNodeId);
  }

  function place(buildingId, tile) {
    const definition = getBuildingById(buildingId);
    if (!definition || !canPlace(tile)) {
      return null;
    }

    const mesh = createBuildingModel(definition);
    mesh.position.copy(tile.world);
    mesh.scale.setScalar(0.001);
    scene.add(mesh);

    const uid = nextBuildingId;
    nextBuildingId += 1;
    const record = {
      uid,
      id: definition.id,
      name: definition.name,
      definition,
      tileIndex: tile.index,
      mesh,
      progress: 0,
      passiveElapsed: 0,
    };

    tile.buildingId = record.uid;
    buildings.push(record);
    return record;
  }

  function remove(record) {
    const index = buildings.indexOf(record);
    if (index === -1) return false;
    scene.remove(record.mesh);
    record.mesh.traverse((child) => {
      if (child.isMesh) {
        child.geometry?.dispose();
      }
    });
    buildings.splice(index, 1);
    const tile = grid.tiles[record.tileIndex];
    if (tile) {
      tile.buildingId = null;
    }
    return true;
  }

  function restore(savedBuildings = []) {
    for (const saved of savedBuildings) {
      const tile = grid.tiles[saved.tileIndex];
      if (!tile || tile.buildingId) {
        continue;
      }
      const record = place(saved.id, tile);
      if (record) {
        record.progress = 1;
        record.passiveElapsed = saved.passiveElapsed ?? 0;
        record.mesh.scale.setScalar(1);
      }
    }
  }

  function snapshot() {
    return buildings.map((building) => ({
      id: building.id,
      tileIndex: building.tileIndex,
      passiveElapsed: building.passiveElapsed,
    }));
  }

  function update(delta) {
    for (const building of buildings) {
      if (building.progress < 1) {
        building.progress = Math.min(1, building.progress + delta * 2.2);
        const eased = THREE.MathUtils.smoothstep(building.progress, 0, 1);
        building.mesh.scale.setScalar(eased);
      }
    }
  }

  function dispose() {
    for (const building of buildings) {
      scene.remove(building.mesh);
      building.mesh.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          // Materials are cached globally — do not dispose them here
        }
      });
    }
    buildings.length = 0;
  }

  return {
    buildings,
    canPlace,
    place,
    remove,
    restore,
    snapshot,
    update,
    dispose,
  };
}
