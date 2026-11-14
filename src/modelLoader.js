import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { dragonBridge } from './models/dragonBridge.js';
import { goldenBridge } from './models/goldenBridge.js';
import { swingBridge } from './models/swingBridge.js';
import { suspensionBridge } from './models/suspensionBridge.js';
import { sunWheel } from './models/sunWheel.js';
import { marbleMountains } from './models/marbleMountains.js';

const builders = {
  rong: dragonBridge,
  nguhanhson: marbleMountains,
  songhan: swingBridge,
  cauvang: goldenBridge,
  thuanphuoc: suspensionBridge,
  sunwheel: sunWheel,
};

let gltfLoader = null;
function loader() {
  if (!gltfLoader) {
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(draco);
  }
  return gltfLoader;
}

// Returns the stop's model: its .glb file when content.js names one, otherwise the model built in code.
export async function loadModel(stop) {
  if (stop.glb) {
    try {
      const gltf = await loader().loadAsync(import.meta.env.BASE_URL + stop.glb);
      gltf.scene.traverse((o) => {
        if (o.isMesh) o.castShadow = o.receiveShadow = true;
      });
      return gltf.scene;
    } catch (err) {
      console.warn(`Could not load ${stop.glb}, using the built-in model instead.`, err);
    }
  }
  return builders[stop.id]();
}
