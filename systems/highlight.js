import * as THREE from "three";

export function createTileHighlight({ scene }) {
  const geometry = new THREE.BoxGeometry(1.06, 0.04, 1.06);
  const hover = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 }),
  );
  const selected = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: 0xf2c84b, transparent: true, opacity: 0.34 }),
  );

  hover.position.y = 0.04;
  selected.position.y = 0.06;
  hover.visible = false;
  selected.visible = false;
  scene.add(hover, selected);

  function place(mesh, tile) {
    if (!tile) {
      mesh.visible = false;
      return;
    }
    mesh.position.x = tile.world.x;
    mesh.position.z = tile.world.z;
    mesh.visible = tile.discovered;
  }

  return {
    setHover: (tile) => place(hover, tile),
    setSelected: (tile) => place(selected, tile),
  };
}
