import * as THREE from "three";
import { gridToWorld } from "../world/grid.js";

export function createPlayer({ scene, grid }) {
  const root = new THREE.Group();
  root.position.copy(gridToWorld(Math.floor(grid.size / 2), Math.floor(grid.size / 2), grid.size));
  root.position.y = 0.2;
  root.castShadow = true;

  const material = new THREE.MeshToonMaterial({ color: 0xf0d29a });
  const clothes = new THREE.MeshToonMaterial({ color: 0x5875b0 });
  const boots = new THREE.MeshToonMaterial({ color: 0x4d3a2d });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.24), clothes);
  body.position.y = 0.7;

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), material);
  head.position.y = 1.14;

  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.12), material);
  const armR = armL.clone();
  armL.position.set(-0.3, 0.72, 0);
  armR.position.set(0.3, 0.72, 0);

  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.14), boots);
  const legR = legL.clone();
  legL.position.set(-0.1, 0.22, 0);
  legR.position.set(0.1, 0.22, 0);

  root.add(body, head, armL, armR, legL, legR);
  root.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(root);

  const target = root.position.clone();
  const velocity = new THREE.Vector3();

  function moveToTile(tile) {
    target.copy(tile.world);
    target.y = 0.2;
  }

  function getGridPosition() {
    return {
      x: Math.floor(root.position.x + grid.size / 2),
      y: Math.floor(root.position.z + grid.size / 2),
    };
  }

  function update(delta, elapsed) {
    const dx = target.x - root.position.x;
    const dz = target.z - root.position.z;
    const dist = Math.hypot(dx, dz);
    const moving = dist > 0.02;

    if (moving) {
      root.lookAt(target.x, root.position.y, target.z);
      const step = delta * 2.8;
      if (dist <= step) {
        root.position.x = target.x;
        root.position.z = target.z;
      } else {
        velocity.set(dx, 0, dz).normalize().multiplyScalar(step);
        root.position.add(velocity);
      }
    } else {
      root.position.x += (target.x - root.position.x) * 0.18;
      root.position.z += (target.z - root.position.z) * 0.18;
    }

    const walkBob = moving ? Math.sin(elapsed * 10) * 0.05 : Math.sin(elapsed * 2.5) * 0.02;
    root.position.y = 0.2 + walkBob;
    armL.rotation.x = moving ? Math.sin(elapsed * 10) * 0.7 : 0;
    armR.rotation.x = moving ? -Math.sin(elapsed * 10) * 0.7 : 0;
    legL.rotation.x = moving ? -Math.sin(elapsed * 10) * 0.65 : 0;
    legR.rotation.x = moving ? Math.sin(elapsed * 10) * 0.65 : 0;
  }

  return {
    root,
    moveToTile,
    getGridPosition,
    update,
    isMoving: () => Math.hypot(root.position.x - target.x, root.position.z - target.z) > 0.08,
    getTileTarget: () => target.clone(),
  };
}
