import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { canvasTexture, rng } from './models/kit.js';

// Dark museum: black monolith plinths hovering above a mirror floor in an arc,
// each under its own spotlight, holding a frameless glass case with a landmark model.
export const ARC = { radius: 22, from: -60, to: 60 };
export const OVERVIEW = { pos: new THREE.Vector3(0, 8.5, 19), target: new THREE.Vector3(0, 1.2, -13) };
export const FLOOR_Y = -6.2;
const HEIGHTS = [0, 0.6, -0.3, 0.5, -0.2, 0.4];
const PLINTH = { w: 5.6, h: 3.2 };
const CASE = { w: 5.0, h: 4.6 };
const FIT = { radius: 2.4, height: 3.8 };
const OPEN_SCALE = 1.7;
const SPOT_Y = 13;
const BG = 0x07090d;

// ---------- room: background, mirror floor, dust ----------
export function buildRoom(scene, { mobile }) {
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.FogExp2(BG, 0.014);

  let mirror = null;
  // the window can report a zero size while the page loads in a hidden tab
  const mirrorSize = (w, h) => [Math.max(256, Math.round(w * 0.6)), Math.max(256, Math.round(h * 0.6))];
  if (mobile) {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      // rough enough that the key light and environment don't leave a hot spot on the floor
      new THREE.MeshStandardMaterial({ color: 0x0b0d10, roughness: 0.7, metalness: 0.2, envMapIntensity: 0.05 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = FLOOR_Y;
    floor.receiveShadow = true;
    scene.add(floor);
  } else {
    const [tw, th] = mirrorSize(innerWidth, innerHeight);
    mirror = new Reflector(new THREE.PlaneGeometry(400, 400), { textureWidth: tw, textureHeight: th, color: 0x55575c });
    mirror.rotation.x = -Math.PI / 2;
    mirror.position.y = FLOOR_Y;
    scene.add(mirror);
    // tinted layer over the mirror so it reads as polished black stone rather than glass
    const tint = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshStandardMaterial({ color: 0x08090c, roughness: 0.85, metalness: 0.1, transparent: true, opacity: 0.82, envMapIntensity: 0.05 }),
    );
    tint.rotation.x = -Math.PI / 2;
    tint.position.y = FLOOR_Y + 0.01;
    tint.receiveShadow = true;
    scene.add(tint);
  }

  // dust motes drifting through the light
  const r = rng(17);
  const n = mobile ? 250 : 600;
  const base = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    base.set([(r() * 2 - 1) * 30, FLOOR_Y + r() * 20, -26 + r() * 30], i * 3);
  }
  const pos = base.slice();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xffe4b5, size: 0.05, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(dust);

  return {
    setSize(w, h) {
      mirror?.getRenderTarget().setSize(...mirrorSize(w, h));
    },
    update(t) {
      for (let i = 0; i < n; i++) {
        pos[i * 3] = base[i * 3] + Math.sin(t * 0.07 + i) * 0.6;
        pos[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.05 + i * 1.7) * 0.8;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

// ---------- shared pieces ----------
function coneMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { power: { value: 0 }, color: { value: new THREE.Color(0xfff0d6) } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `varying float vY; varying vec3 vN; varying vec3 vV;
      void main(){ vY = uv.y; vec4 mv = modelViewMatrix * vec4(position,1.0);
      vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float power; uniform vec3 color; varying float vY; varying vec3 vN; varying vec3 vV;
      void main(){ float edge = pow(abs(dot(vN, vV)), 1.5);
      float a = smoothstep(0.0, 1.0, vY) * 0.10 * edge * power;
      gl_FragColor = vec4(color * a, a); }`,
  });
}

function floorPoolTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,226,170,0.55)');
    g.addColorStop(0.45, 'rgba(255,214,150,0.16)');
    g.addColorStop(1, 'rgba(255,214,150,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function engraving(index, title) {
  return canvasTexture(1024, 160, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#d8b46a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // canvas letter-spacing keeps Vietnamese tone marks on their letters; older browsers just draw it tighter
    ctx.letterSpacing = '10px';
    const text = `${String(index + 1).padStart(2, '0')}   ·   ${title.toUpperCase()}`.normalize('NFC');
    let size = 64;
    do {
      ctx.font = `300 ${size}px "Cormorant Garamond", Georgia, serif`;
      size -= 4;
    } while (ctx.measureText(text).width > w * 0.92 && size > 24);
    ctx.fillText(text, w / 2, h / 2);
  });
}

// ---------- one station ----------
function buildStation(i, shared) {
  const st = new THREE.Group();

  const plinth = new THREE.Mesh(new RoundedBoxGeometry(PLINTH.w, PLINTH.h, PLINTH.w, 4, 0.22), shared.plinth);
  plinth.position.y = -PLINTH.h / 2;
  plinth.castShadow = plinth.receiveShadow = true;
  st.add(plinth);

  // thin glowing gold inlay just below the top edge
  const inlay = new THREE.Group();
  const iw = PLINTH.w + 0.005, t = 0.035;
  for (const s of [-1, 1]) {
    inlay.add(new THREE.Mesh(new THREE.BoxGeometry(iw, t, t), shared.inlay).translateZ(s * iw / 2));
    inlay.add(new THREE.Mesh(new THREE.BoxGeometry(t, t, iw), shared.inlay).translateX(s * iw / 2));
  }
  inlay.position.y = -0.32;
  st.add(inlay);

  // engraved index and name on the front face
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 0.72),
    new THREE.MeshStandardMaterial({ transparent: true, emissive: 0xd8b46a, emissiveIntensity: 0.35, metalness: 0.8, roughness: 0.3, depthWrite: false }),
  );
  plate.position.set(0, -1.15, PLINTH.w / 2 + 0.01);
  st.add(plate);

  // soft light pool on the floor beneath the hovering plinth
  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshBasicMaterial({ map: shared.pool, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
  );
  pool.rotation.x = -Math.PI / 2;
  st.add(pool);

  // frameless glass case: faint panes plus bright hairline edges
  const glass = new THREE.Group();
  const caseGeo = new THREE.BoxGeometry(CASE.w, CASE.h, CASE.w);
  const panes = new THREE.Mesh(caseGeo, shared.glass.clone());
  panes.position.y = CASE.h / 2 + 0.02;
  panes.renderOrder = 2;
  glass.add(panes);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(caseGeo), shared.edge.clone());
  edges.position.copy(panes.position);
  glass.add(edges);
  st.add(glass);

  const pivot = new THREE.Group();
  pivot.position.y = 0.25;
  st.add(pivot);

  const spot = new THREE.SpotLight(0xfff1dc, 0, 28, 0.36, 0.75, 1.2);
  spot.position.set(0, SPOT_Y, 1.2);
  spot.target.position.set(0, 0, 0);
  st.add(spot, spot.target);

  const cone = new THREE.Mesh(new THREE.ConeGeometry(Math.tan(0.36) * SPOT_Y, SPOT_Y, 40, 1, true), coneMaterial());
  cone.position.y = SPOT_Y / 2;
  cone.renderOrder = 3;
  st.add(cone);

  return { group: st, glass, panes, edges, pivot, plate, pool, spot, cone };
}

export function buildGallery(scene, stops) {
  const shared = {
    // satin black: glossy enough to catch edge highlights, rough enough that the spotlight doesn't flare
    plinth: new THREE.MeshPhysicalMaterial({ color: 0x141619, roughness: 0.55, metalness: 0.35, envMapIntensity: 1.3 }),
    inlay: new THREE.MeshStandardMaterial({ color: 0x3a2a10, emissive: 0xe0b45c, emissiveIntensity: 3 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xffffff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.06,
      side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 0.5,
    }),
    edge: new THREE.LineBasicMaterial({ color: 0xf0dcb0, transparent: true, opacity: 0.55 }),
    pool: floorPoolTexture(),
  };

  const stations = stops.map((stop, i) => {
    const a = THREE.MathUtils.degToRad(ARC.from + ((ARC.to - ARC.from) * i) / (stops.length - 1));
    const s = buildStation(i, shared);
    const base = new THREE.Vector3(Math.sin(a) * ARC.radius, HEIGHTS[i % HEIGHTS.length], -Math.cos(a) * ARC.radius);
    s.group.position.copy(base);
    s.group.rotation.y = Math.atan2(OVERVIEW.pos.x - base.x, OVERVIEW.pos.z - base.z);
    s.group.userData.stop = stop.id;
    scene.add(s.group);

    const label = document.createElement('button');
    label.type = 'button';
    label.className = 'label';
    label.style.pointerEvents = 'auto';
    const labelObj = new CSS2DObject(label);
    labelObj.position.set(0, CASE.h + 1.6, 0);
    s.group.add(labelObj);

    return { ...s, stop, index: i, base, phase: i * 1.3, label, open: 0, power: 0, focus: 1, model: null };
  });

  return {
    stations,
    setModel(i, model) {
      const st = stations[i];
      // wrap so fitting works whatever transform the model (or a .glb scene) arrives with
      const wrap = new THREE.Group();
      wrap.add(model);
      fitRotating(wrap, FIT.radius, FIT.height);
      st.pivot.add(wrap);
      st.model = model;
    },
    setLang(lang) {
      for (const st of stations) {
        const t = st.stop[lang];
        st.plate.material.map?.dispose();
        st.plate.material.map = engraving(st.index, t.landmark);
        st.plate.material.emissiveMap = st.plate.material.map;
        st.plate.material.needsUpdate = true;
        st.label.innerHTML = `<span class="num">${String(st.index + 1).padStart(2, '0')}</span><span class="name">${t.landmark}</span>`;
      }
    },
    // where the camera should look from and at for a station
    view(i, distance) {
      const st = stations[i];
      const p = st.group.position;
      const dir = new THREE.Vector3(OVERVIEW.pos.x - p.x, 0, OVERVIEW.pos.z - p.z).normalize();
      return {
        pos: p.clone().addScaledVector(dir, distance).add(new THREE.Vector3(0, 3.2, 0)),
        target: p.clone().add(new THREE.Vector3(0, 2.0, 0)),
      };
    },
    // power: 0..1 per station, driven by the intro sequence
    setPower(i, value) {
      stations[i].power = value;
    },
    update(t, dt, selected) {
      stations.forEach((st, i) => {
        const goal = i === selected ? 1 : 0;
        const k = Math.min(1, dt * 3);
        st.open += (goal - st.open) * k;
        st.focus += ((selected < 0 || i === selected ? 1 : 0.35) - st.focus) * k;
        const lit = st.power * st.focus;

        st.group.position.y = st.base.y + Math.sin(t * 0.45 + st.phase) * 0.18;
        st.pool.position.y = FLOOR_Y - st.group.position.y + 0.03;
        st.pool.material.opacity = lit * 0.4;
        st.spot.intensity = lit * (i === selected ? 55 : 42);
        st.cone.material.uniforms.power.value = lit;
        st.plate.material.opacity = 0.25 + lit * 0.75;

        st.glass.position.y = st.open * 10;
        st.panes.material.opacity = 0.07 * (1 - st.open);
        st.edges.material.opacity = 0.55 * (1 - st.open) * (0.3 + 0.7 * lit);
        st.glass.visible = st.open < 0.98;
        st.pivot.scale.setScalar(1 + st.open * (OPEN_SCALE - 1));
        st.pivot.position.y = 0.25 + st.open * 0.5;
        if (i !== selected) {
          st.pivot.rotation.y += dt * 0.12;
        } else {
          // ease toward the model's best viewing angle, taking the short way round
          const front = st.model?.userData.front ?? 0;
          const diff = THREE.MathUtils.euclideanModulo(front - st.pivot.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
          st.pivot.rotation.y += diff * Math.min(1, dt * 2.5);
        }
        st.model?.userData.update?.(dt);
      });
    },
  };
}

// Scale and center an object so it can spin inside a cylinder of the given radius and height
function fitRotating(object, radius, height) {
  object.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(object);
  const c = b.getCenter(new THREE.Vector3());
  // farthest vertex from the vertical axis through the box centre
  let reach = 0;
  const v = new THREE.Vector3();
  const m = new THREE.Matrix4();
  object.traverse((o) => {
    const pos = o.geometry?.attributes.position;
    if (!pos) return;
    for (let k = 0; k < (o.isInstancedMesh ? o.count : 1); k++) {
      if (o.isInstancedMesh) o.getMatrixAt(k, m); else m.identity();
      m.premultiply(o.matrixWorld);
      for (let i = 0; i < pos.count; i += 3) {
        v.fromBufferAttribute(pos, i).applyMatrix4(m);
        reach = Math.max(reach, Math.hypot(v.x - c.x, v.z - c.z));
      }
    }
  });
  const k = Math.min(radius / reach, height / (b.max.y - b.min.y));
  object.scale.multiplyScalar(k);
  object.position.set(-c.x * k, -b.min.y * k, -c.z * k);
}
