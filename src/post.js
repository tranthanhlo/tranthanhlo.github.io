import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const FinishShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    grain: { value: 0.035 },
    vignette: { value: 0.55 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time; uniform float grain; uniform float vignette; varying vec2 vUv;
    float rand(vec2 co){ return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 d = vUv - 0.5;
      c.rgb *= 1.0 - vignette * smoothstep(0.25, 0.85, dot(d, d) * 2.2);
      c.rgb += (rand(vUv * 1000.0 + time) - 0.5) * grain;
      gl_FragColor = c;
    }`,
};

// Bloom for the gold inlays, lamps and dragon; vignette and film grain; SMAA on desktop.
export function createPost(renderer, scene, camera, { mobile }) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const scale = mobile ? 0.5 : 1;
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth * scale, innerHeight * scale), 0.45, 0.5, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const finish = new ShaderPass(FinishShader);
  if (mobile) finish.uniforms.grain.value = 0;
  composer.addPass(finish);
  const smaa = mobile ? null : new SMAAPass(Math.max(1, innerWidth) * renderer.getPixelRatio(), Math.max(1, innerHeight) * renderer.getPixelRatio());
  if (smaa) composer.addPass(smaa);

  return {
    render(t) {
      finish.uniforms.time.value = t % 100;
      composer.render();
    },
    setSize(w, h) {
      composer.setSize(w, h);
      bloom.setSize(w * scale, h * scale);
    },
  };
}
