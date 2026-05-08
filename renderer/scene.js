import * as THREE from "three";

export function createSceneRenderer({ canvas }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa8dcf7);

  const camera = new THREE.OrthographicCamera(-14, 14, 10, -10, 0.1, 100);
  camera.position.set(12, 17, 12);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const hemi = new THREE.HemisphereLight(0xfff1c2, 0x4b6b56, 1.2);
  scene.add(hemi);

  const fill = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(fill);

  const sun = new THREE.DirectionalLight(0xfff5d9, 1.8);
  sun.position.set(12, 22, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 20;
  sun.shadow.camera.bottom = -20;
  scene.add(sun);

  function resize() {
    const aspect = window.innerWidth / window.innerHeight;
    const viewSize = 11;
    camera.left = -viewSize * aspect;
    camera.right = viewSize * aspect;
    camera.top = viewSize;
    camera.bottom = -viewSize;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener("resize", resize);
  resize();

  function dispose() {
    window.removeEventListener("resize", resize);
    renderer.dispose();
  }

  return {
    scene,
    camera,
    renderer,
    lights: {
      hemi,
      sun,
      fill,
    },
    dispose,
  };
}
