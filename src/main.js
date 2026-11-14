import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { nightLights } from './models/kit.js';
import { buildRoom, buildGallery, OVERVIEW } from './gallery.js';
import { createPost } from './post.js';
import { loadModel } from './modelLoader.js';
import { dragonFire } from './effects.js';
import { initUI } from './ui.js';
import { stops } from './content.js';

const container = document.getElementById('scene');
const mobile = matchMedia('(max-width: 760px)').matches;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- renderer, scene, camera ----------
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
Object.assign(labelRenderer.domElement.style, { position: 'fixed', inset: '0', pointerEvents: 'none' });
container.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;

const camera = new THREE.PerspectiveCamera(mobile ? 55 : 40, (innerWidth || 16) / (innerHeight || 9), 0.2, 400);
const INTRO_START = { pos: new THREE.Vector3(0, 2.5, 4), target: new THREE.Vector3(0, 1.5, -20) };
camera.position.copy(reducedMotion ? OVERVIEW.pos : INTRO_START.pos);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 60;
controls.maxPolarAngle = 1.62;
controls.target.copy(reducedMotion ? OVERVIEW.target : INTRO_START.target);

// low fill, a key light for model shadows on the plinth tops, and a cool rim from behind
scene.add(new THREE.HemisphereLight(0x8090b0, 0x050505, 0.25));
const key = new THREE.DirectionalLight(0xfff2e0, 0.9);
key.position.set(8, 22, 14);
key.target.position.set(0, 0, -13);
key.castShadow = true;
key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
Object.assign(key.shadow.camera, { left: -28, right: 28, top: 22, bottom: -22, near: 5, far: 70 });
key.shadow.bias = -0.0004;
key.shadow.radius = 4;
scene.add(key, key.target);
const rim = new THREE.DirectionalLight(0x9db8ff, 0.8);
rim.position.set(-10, 8, -40);
scene.add(rim);

const room = buildRoom(scene, { mobile });
const gallery = buildGallery(scene, stops);
const post = createPost(renderer, scene, camera, { mobile });
const fire = dragonFire(scene);
let dragon = null;
const peakLabels = [];

stops.forEach(async (stop, i) => {
  const model = await loadModel(stop);
  gallery.setModel(i, model);
  if (stop.id === 'rong') dragon = model;
  if (stop.peakLabels && model.userData.peaks) {
    model.userData.peaks.forEach((marker, k) => {
      const el = document.createElement('div');
      el.className = 'label peak';
      el.textContent = stop.peakLabels[k];
      marker.add(new CSS2DObject(el));
      peakLabels.push(el);
    });
  }
});

// ---------- camera flights ----------
let tween = null;
function flyTo(pos, target, duration = 1.6) {
  // wall-clock based so the flight keeps its duration even when frames drop
  tween = {
    start: performance.now() / 1000, duration,
    fromPos: camera.position.clone(), toPos: pos.clone(),
    fromTarget: controls.target.clone(), toTarget: target.clone(),
  };
}
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
function updateTween(now) {
  if (!tween) return;
  const t = Math.min(1, (now - tween.start) / tween.duration);
  const k = ease(t);
  camera.position.lerpVectors(tween.fromPos, tween.toPos, k);
  controls.target.lerpVectors(tween.fromTarget, tween.toTarget, k);
  if (t === 1) tween = null;
}

// ---------- intro: spotlights switch on one by one while the camera pulls back ----------
const introStart = performance.now() / 1000;
function updateIntro(now) {
  gallery.stations.forEach((st, i) => {
    const on = reducedMotion ? 1 : THREE.MathUtils.clamp((now - introStart - 0.6 - i * 0.4) / 0.7, 0, 1);
    gallery.setPower(i, on * on);
  });
}
if (!reducedMotion) flyTo(OVERVIEW.pos, OVERVIEW.target, 5);

// ---------- selection ----------
let selected = -1;
function select(i) {
  selected = i;
  // back off far enough that the opened model fits the screen width left free by the side panel
  const free = innerWidth > 760 ? Math.max(0.4, (innerWidth - 440) / innerWidth) : 1;
  const halfWidth = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.aspect || 1) * free;
  const v = gallery.view(i, Math.max(11, 5.4 / halfWidth));
  flyTo(v.pos, v.target);
  ui.open(i);
  gallery.stations.forEach((st, k) => st.label.classList.toggle('active', k === i));
  peakLabels.forEach((el) => el.classList.toggle('show', stops[i].id === 'nguhanhson'));
}
function home() {
  selected = -1;
  ui.close();
  flyTo(OVERVIEW.pos, OVERVIEW.target);
  gallery.stations.forEach((st) => st.label.classList.remove('active'));
  peakLabels.forEach((el) => el.classList.remove('show'));
}
gallery.stations.forEach((st, i) => st.label.addEventListener('click', () => select(i)));

// ---------- landmark lights (LEDs, street lamps, dragon eyes) ----------
let showLights = false;
function setShowLights(on) {
  showLights = on;
  ui.setLights(on);
  for (const l of nightLights) {
    if (l.mat) l.mat.emissiveIntensity = on ? l.night : 0;
    if (l.line) l.line.color.copy(on ? l.nightColor : l.day);
  }
}

const ui = initUI({
  onSelect: select,
  onHome: home,
  onToggleLights: () => setShowLights(!showLights),
  onAction: (action) => {
    if (action !== 'fire') return;
    if (!showLights) setShowLights(true);
    fire.start(4);
  },
  onLangChange: (lang) => gallery.setLang(lang),
});

// ---------- picking and swipe ----------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const pickables = gallery.stations.map((st) => st.group);
let down = null;

function pick(e) {
  pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(pickables, true).find((h) => h.object.isMesh);
  let o = hit?.object;
  while (o && o.userData.stop === undefined) o = o.parent;
  return o ? stops.findIndex((s) => s.id === o.userData.stop) : -1;
}
renderer.domElement.addEventListener('pointerdown', (e) => {
  down = { x: e.clientX, y: e.clientY, t: performance.now() };
  tween = null;
});
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!down) return;
  const dx = e.clientX - down.x, dy = e.clientY - down.y;
  const quick = performance.now() - down.t < 350;
  down = null;
  // quick horizontal swipe on touch screens moves to the next or previous case
  if (e.pointerType === 'touch' && quick && Math.abs(dx) > 70 && Math.abs(dy) < 50) {
    const from = selected < 0 ? 0 : selected;
    select((from + (dx < 0 ? 1 : -1) + stops.length) % stops.length);
    return;
  }
  if (Math.hypot(dx, dy) > 6) return;
  const i = pick(e);
  if (i >= 0) select(i);
});
renderer.domElement.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || e.buttons) return;
  renderer.domElement.style.cursor = pick(e) >= 0 ? 'pointer' : '';
});

function onResize() {
  if (!innerWidth || !innerHeight) return;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  labelRenderer.setSize(innerWidth, innerHeight);
  post.setSize(innerWidth, innerHeight);
  room.setSize(innerWidth, innerHeight);
}
addEventListener('resize', onResize);

// The panel covers the right side (desktop) or the bottom (mobile), and the intro text sits on the left,
// so shift the view to keep the models clear of them.
const panel = document.getElementById('panel');
const intro = document.getElementById('intro');
const shift = { x: 0, y: 0 };
function updateViewOffset() {
  const open = panel.classList.contains('open');
  const wide = innerWidth > 760;
  const introShown = !intro.classList.contains('hide');
  const goal = {
    x: open && wide ? (panel.offsetWidth + 16) / 2 : introShown && wide ? -innerWidth * 0.17 : 0,
    y: open && !wide ? panel.offsetHeight / 2 : 0,
  };
  if (!goal.x && !goal.y && !shift.x && !shift.y) return;
  for (const k of ['x', 'y']) {
    shift[k] += (goal[k] - shift[k]) * 0.12;
    if (Math.abs(goal[k] - shift[k]) < 0.5) shift[k] = goal[k];
  }
  if (!shift.x && !shift.y) camera.clearViewOffset();
  else camera.setViewOffset(innerWidth, innerHeight, shift.x, shift.y, innerWidth, innerHeight);
}

// ---------- loop ----------
setShowLights(false);
ui.applyLang();
// redraw the engraved plates once the display font has loaded
document.fonts?.ready.then(() => ui.applyLang());
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  // allow larger steps than the particle sim so case animations keep pace when frames drop
  const rawDt = Math.min(clock.getDelta(), 0.25);
  const dt = Math.min(rawDt, 0.05);
  const now = performance.now() / 1000;
  // a page opened in a background tab starts at zero size and may miss the resize event
  if (renderer.domElement.width === 0 && innerWidth > 0) onResize();
  updateTween(now);
  updateViewOffset();
  updateIntro(now);
  controls.update();
  room.update(now);
  gallery.update(now, rawDt, selected);
  fire.update(dt, now, dragon?.userData.mouth, dragon?.userData.mouthTip);
  post.render(now);
  labelRenderer.render(scene, camera);
});
