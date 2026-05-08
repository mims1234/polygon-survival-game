import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import * as THREE from "three";

export function createPostFX({ renderer, scene, camera }) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.3, 0.35, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  function resize() {
    composer.setSize(window.innerWidth, window.innerHeight);
    bloom.setSize(window.innerWidth, window.innerHeight);
  }

  window.addEventListener("resize", resize);
  resize();

  function dispose() {
    window.removeEventListener("resize", resize);
    composer.dispose();
  }

  return {
    composer,
    bloom,
    render: () => composer.render(),
    dispose,
  };
}
