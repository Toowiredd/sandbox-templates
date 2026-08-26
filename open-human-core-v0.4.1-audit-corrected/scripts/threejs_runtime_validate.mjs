#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputIndex = process.argv.indexOf('--output');
const output = outputIndex >= 0
  ? path.resolve(process.argv[outputIndex + 1])
  : path.join(root, 'reports/threejs-runtime-attempt.json');
const assets = process.argv.slice(2).filter((value, index, values) =>
  !value.startsWith('--') && !(index > 0 && values[index - 1] === '--output'));
const inputs = assets.length
  ? assets.map((item) => path.resolve(item))
  : [
      path.join(root, 'assets/runtime/humans/human_core_01.glb'),
      path.join(root, 'assets/runtime/humans/human_core_01_lod1.glb'),
      path.join(root, 'assets/runtime/humans/human_core_01_lod2.glb'),
    ];

const receipt = {
  schema_version: 1,
  validator: 'real Three.js GLTFLoader + AnimationMixer + SkeletonUtils attempt',
  generated_at_utc: new Date().toISOString(),
  package_resolution: null,
  passed: false,
  assets: [],
  boundary: 'This proves loader, animation-object, and clone execution only. It does not prove WebGL rendering or human visual acceptance.',
};

try {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const SkeletonUtils = await import('three/addons/utils/SkeletonUtils.js');
  receipt.package_resolution = {
    available: true,
    three_revision: THREE.REVISION,
    module_url: String(pathToFileURL(path.dirname(fileURLToPath(import.meta.resolve('three'))))),
  };

  if (typeof globalThis.ProgressEvent === 'undefined') {
    globalThis.ProgressEvent = class ProgressEvent {
      constructor(type, init = {}) { this.type = type; Object.assign(this, init); }
    };
  }

  for (const input of inputs) {
    const data = fs.readFileSync(input);
    const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    const loader = new GLTFLoader();
    const gltf = await loader.parseAsync(arrayBuffer, `${path.dirname(input)}/`);
    const meshes = [];
    const morphs = new Set();
    gltf.scene.traverse((object) => {
      if (!object.isSkinnedMesh) return;
      meshes.push({ name: object.name, bones: object.skeleton.bones.length });
      Object.keys(object.morphTargetDictionary || {}).forEach((name) => morphs.add(name));
    });
    const mixer = new THREE.AnimationMixer(gltf.scene);
    const clipResults = [];
    for (const clip of gltf.animations) {
      const action = mixer.clipAction(clip);
      action.reset().play();
      mixer.update(Math.min(1 / 30, Math.max(clip.duration / 100, 1 / 120)));
      clipResults.push({ name: clip.name, duration: clip.duration, running: action.isRunning() });
      action.stop();
    }
    const cloneA = SkeletonUtils.clone(gltf.scene);
    const cloneB = SkeletonUtils.clone(gltf.scene);
    const result = {
      input,
      parsed_by_GLTFLoader: true,
      skinned_meshes: meshes,
      morph_targets: [...morphs].sort(),
      clips_executed_with_AnimationMixer: clipResults,
      independent_clones_created: cloneA !== cloneB && cloneA !== gltf.scene && cloneB !== gltf.scene,
    };
    result.passed = meshes.length === 3
      && meshes.every((item) => item.bones === 56)
      && clipResults.length >= 4
      && clipResults.every((item) => item.running)
      && result.independent_clones_created;
    receipt.assets.push(result);
  }
  receipt.passed = receipt.assets.length === inputs.length && receipt.assets.every((item) => item.passed);
} catch (error) {
  receipt.package_resolution = receipt.package_resolution || { available: false };
  receipt.error = {
    name: error?.name || 'Error',
    code: error?.code || null,
    message: String(error?.message || error),
  };
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
process.exit(receipt.passed ? 0 : 2);
