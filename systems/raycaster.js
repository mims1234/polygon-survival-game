import * as THREE from "three";

export function createRaycastSystem({ camera, canvas, target }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pickTarget = target;

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function pickTile(event) {
    updatePointer(event);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(pickTarget);
    const hit = hits[0];
    return hit ? hit.instanceId : null;
  }

  return {
    pickTile,
    pointer,
    setTarget: (nextTarget) => {
      pickTarget = nextTarget;
    },
  };
}
