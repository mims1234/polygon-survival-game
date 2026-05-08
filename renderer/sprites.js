import * as THREE from "three";

function makeTextTexture(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(18, 30, 24, 0.12)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = "bold 38px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 10;
  ctx.strokeStyle = "rgba(22, 34, 26, 0.6)";
  ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = "#fff7dd";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createSpriteSystem({ scene }) {
  const popups = [];

  function spawn(text, position) {
    const material = new THREE.SpriteMaterial({
      map: makeTextTexture(text),
      transparent: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position).add(new THREE.Vector3(0, 1.4, 0));
    sprite.scale.set(1.8, 0.9, 1);
    scene.add(sprite);
    popups.push({ sprite, age: 0 });
  }

  function update(delta) {
    for (let i = popups.length - 1; i >= 0; i -= 1) {
      const popup = popups[i];
      popup.age += delta;
      popup.sprite.position.y += delta * 0.7;
      popup.sprite.material.opacity = Math.max(0, 1 - popup.age / 1.2);

      if (popup.age >= 1.2) {
        scene.remove(popup.sprite);
        popup.sprite.material.map.dispose();
        popup.sprite.material.dispose();
        popups.splice(i, 1);
      }
    }
  }

  return {
    spawn,
    update,
  };
}
