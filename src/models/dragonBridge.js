import * as THREE from 'three';
import { mat, glowMat, mesh, box, instances, compose, canvasTexture, rng, palette } from './kit.js';

// Tube whose radius varies along the curve (tail taper, neck, horns, whiskers)
export function taperedTube(curve, tubular, radial, radiusAt) {
  const frames = curve.computeFrenetFrames(tubular, false);
  const pos = [], uv = [], idx = [];
  const P = new THREE.Vector3();
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    curve.getPointAt(t, P);
    const N = frames.normals[i], B = frames.binormals[i];
    const r = radiusAt(t);
    for (let j = 0; j <= radial; j++) {
      const v = (j / radial) * Math.PI * 2;
      const s = Math.sin(v), c = -Math.cos(v);
      pos.push(P.x + r * (c * N.x + s * B.x), P.y + r * (c * N.y + s * B.y), P.z + r * (c * N.z + s * B.z));
      uv.push(t, j / radial);
    }
  }
  for (let i = 0; i < tubular; i++) {
    for (let j = 0; j < radial; j++) {
      const a = (radial + 1) * i + j, b = (radial + 1) * (i + 1) + j;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

function scaleTexture() {
  return canvasTexture(128, 64, (ctx, w, h) => {
    ctx.fillStyle = '#b8860b';
    ctx.fillRect(0, 0, w, h);
    const rows = 4, cols = 8, rw = w / cols, rh = h / rows;
    for (let r = 0; r < rows + 1; r++) {
      for (let c = 0; c < cols + 1; c++) {
        const x = c * rw + (r % 2 ? rw / 2 : 0), y = r * rh;
        const g = ctx.createRadialGradient(x, y - rh * 0.2, 1, x, y, rw * 0.6);
        g.addColorStop(0, '#ffe08a');
        g.addColorStop(0.7, '#d9a321');
        g.addColorStop(1, '#7a5208');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rw * 0.55, 0, Math.PI);
        ctx.fill();
      }
    }
  }, { repeat: [60, 3] });
}

function roadTexture() {
  return canvasTexture(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#3b3e42';
    ctx.fillRect(0, 0, w, h);
    const r = rng(9);
    for (let i = 0; i < 1500; i++) {
      const v = 50 + r() * 30;
      ctx.fillStyle = `rgba(${v},${v},${v + 4},0.5)`;
      ctx.fillRect(r() * w, r() * h, 2, 2);
    }
    // median strip where the dragon sits
    ctx.fillStyle = '#9aa0a6';
    ctx.fillRect(0, h / 2 - 9, w, 18);
    ctx.fillStyle = '#e8e8e8';
    for (const lane of [0.17, 0.32, 0.68, 0.83]) {
      for (let x = 0; x < w; x += 48) ctx.fillRect(x, lane * h - 1, 26, 2);
    }
    ctx.fillStyle = '#f2c94c';
    ctx.fillRect(0, h / 2 - 11, w, 2);
    ctx.fillRect(0, h / 2 + 9, w, 2);
  }, { repeat: [10, 1] });
}

// Cầu Rồng (Dragon River Bridge), 666 m long, steel dragon arching over six lanes
export function dragonBridge() {
  const g = new THREE.Group();
  const L = 62;
  const deckTop = 4.6;

  // river and embankments
  const water = palette.darkWater;
  g.add(box(L + 6, 0.6, 16, water, { y: -0.3 }));
  const stone = palette.porcelainShade;
  const grass = palette.porcelain;
  for (const s of [-1, 1]) {
    g.add(box(3, deckTop - 0.3, 16, stone, { x: s * (L / 2 + 1.5), y: (deckTop - 0.3) / 2 }));
    g.add(box(3, 0.3, 16, grass, { x: s * (L / 2 + 1.5), y: deckTop - 0.15 }));
  }

  // deck: box girder, road surface with lanes, curbs, railings, street lamps
  const concrete = palette.porcelain;
  g.add(box(L, 1.4, 9, concrete, { y: deckTop - 0.7 }));
  const road = new THREE.Mesh(new THREE.PlaneGeometry(L, 8.6), mat(0xffffff, { map: roadTexture(), roughness: 0.95 }));
  road.rotation.x = -Math.PI / 2;
  road.position.y = deckTop + 0.01;
  road.receiveShadow = true;
  g.add(road);
  for (const z of [-4.3, 4.3]) g.add(box(L, 0.3, 0.4, concrete, { y: deckTop + 0.15, z }));

  const steel = palette.steel;
  const posts = [];
  for (let x = -L / 2; x <= L / 2; x += 0.8) {
    for (const z of [-4.45, 4.45]) posts.push(compose(new THREE.Vector3(x, deckTop + 0.65, z)));
  }
  g.add(instances(new THREE.BoxGeometry(0.08, 0.7, 0.08), steel, posts));
  for (const z of [-4.45, 4.45]) g.add(box(L, 0.08, 0.14, steel, { y: deckTop + 1.02, z, shadow: false }));

  const lampGlow = glowMat(0xfff3d6, 0xffd27a, 3);
  for (let x = -L / 2 + 3; x < L / 2; x += 6) {
    for (const s of [-1, 1]) {
      g.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.4, 6), steel, { x, y: deckTop + 1.4, z: s * 4.1 }));
      g.add(box(0.7, 0.06, 0.08, steel, { x, y: deckTop + 2.6, z: s * 3.8 }));
      g.add(box(0.35, 0.12, 0.2, lampGlow, { x: x + 0.1, y: deckTop + 2.52, z: s * 3.5, shadow: false }));
    }
  }

  // piers with cutwaters
  for (let x = -24; x <= 24; x += 12) {
    const pier = mesh(new THREE.CylinderGeometry(1.1, 1.3, deckTop - 1.4, 16), concrete, { x, y: (deckTop - 1.4) / 2 });
    pier.scale.z = 3;
    g.add(pier);
    g.add(box(2.2, 0.5, 8, concrete, { x, y: deckTop - 1.6 }));
  }

  // dragon body: tail curl, five arches, rising neck
  const pts = [
    new THREE.Vector3(-28.5, deckTop + 3.4, 0),
    new THREE.Vector3(-30, deckTop + 2.2, 0),
    new THREE.Vector3(-29.5, deckTop + 0.9, 0),
    new THREE.Vector3(-28, deckTop + 0.4, 0),
  ];
  const span = 52;
  for (let i = 1; i <= 100; i++) {
    const u = i / 100;
    const x = -28 + u * span;
    // four full arches and a half arch that becomes the rising neck
    const y = deckTop + 0.4 + 8.4 * Math.abs(Math.sin(Math.PI * 4.5 * u)) ** 0.9;
    pts.push(new THREE.Vector3(x, y, 0));
  }
  pts.push(new THREE.Vector3(25.2, deckTop + 10.4, 0), new THREE.Vector3(26.4, deckTop + 10.9, 0));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const radius = (t) => {
    if (t < 0.06) return 0.12 + (t / 0.06) * 0.55;
    if (t < 0.16) return 0.67 + ((t - 0.06) / 0.1) * 0.35;
    if (t > 0.94) return 1.02 - ((t - 0.94) / 0.06) * 0.15;
    return 1.02;
  };
  const gold = glowMat(0xffffff, 0xffa31a, 0.9, { map: scaleTexture(), metalness: 0.85, roughness: 0.32 });
  const body = mesh(taperedTube(curve, 400, 14, radius), gold);
  g.add(body);

  // belly plate: a thinner, paler band under the body
  const bellyMat = palette.gold;
  const belly = mesh(taperedTube(curve, 300, 8, (t) => radius(t) * 0.55), bellyMat);
  belly.position.y = -0.55;
  g.add(belly);

  // dorsal fins, perpendicular to the body and pointing away from the arch centre
  const fins = [];
  const up = new THREE.Vector3(0, 1, 0);
  const T = new THREE.Vector3(), P = new THREE.Vector3();
  for (let i = 0; i < 120; i++) {
    const t = 0.05 + (i / 120) * 0.9;
    curve.getPointAt(t, P);
    curve.getTangentAt(t, T);
    const n = new THREE.Vector3(-T.y, T.x, 0).normalize();
    if (n.y < 0) n.negate();
    const r = radius(t);
    const size = 0.5 + 0.25 * Math.sin(i * 0.9) ** 2;
    const q = new THREE.Quaternion().setFromUnitVectors(up, n);
    fins.push(compose(P.clone().addScaledVector(n, r + size * 0.4), q, new THREE.Vector3(size, size * 1.6, size * 0.35)));
  }
  g.add(instances(new THREE.ConeGeometry(0.45, 1, 4), palette.goldDark, fins));

  // head at the east end, facing the sea
  const head = dragonHead(gold);
  head.position.set(27.4, deckTop + 11.2, 0);
  head.rotation.z = -0.12;
  g.add(head);
  g.userData.mouth = head.userData.mouth;
  g.userData.mouthTip = head.userData.mouthTip;
  return g;
}

function dragonHead(gold) {
  const h = new THREE.Group();
  const darkGold = palette.goldDark;
  const ivory = palette.porcelain;

  const skull = mesh(new THREE.SphereGeometry(1.5, 20, 14), gold);
  skull.scale.set(1.35, 1, 1.05);
  h.add(skull);

  const snout = mesh(new THREE.CylinderGeometry(0.75, 1.15, 2.8, 14), gold, { x: 2.2, y: -0.15 });
  snout.rotation.z = Math.PI / 2;
  snout.scale.x = 0.8;
  h.add(snout);
  h.add(mesh(new THREE.SphereGeometry(0.85, 14, 10), gold, { x: 3.55, y: -0.1 }));
  for (const z of [-0.35, 0.35]) h.add(mesh(new THREE.SphereGeometry(0.16, 8, 6), darkGold, { x: 4.3, y: 0.2, z }));

  const jaw = mesh(new THREE.CylinderGeometry(0.45, 0.85, 2.6, 12), gold, { x: 1.9, y: -1.25 });
  jaw.rotation.z = Math.PI / 2 + 0.28;
  jaw.scale.x = 0.7;
  h.add(jaw);

  const teeth = [];
  for (let i = 0; i < 6; i++) {
    for (const z of [-0.45, 0.45]) {
      teeth.push(compose(new THREE.Vector3(2.4 + i * 0.32, -0.75, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI, 0, 0)), new THREE.Vector3(1, 1, 1)));
    }
  }
  h.add(instances(new THREE.ConeGeometry(0.09, 0.35, 5), ivory, teeth));

  const eye = glowMat(0x3a0500, 0xff3300, 3.5, { roughness: 0.2 });
  for (const z of [-0.95, 0.95]) {
    h.add(mesh(new THREE.SphereGeometry(0.32, 12, 10), eye, { x: 1.05, y: 0.55, z }));
    const brow = box(1.1, 0.25, 0.4, darkGold, { x: 1.0, y: 0.95, z: z * 1.05 });
    brow.rotation.z = -0.25;
    h.add(brow);
  }

  // swept-back horns
  for (const s of [-1, 1]) {
    const horn = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.2, 1.1, s * 0.6),
      new THREE.Vector3(-1.4, 2.0, s * 0.9),
      new THREE.Vector3(-2.6, 2.4, s * 1.2),
      new THREE.Vector3(-3.4, 2.1, s * 1.35),
    ]);
    h.add(mesh(taperedTube(horn, 24, 8, (t) => 0.3 * (1 - t) + 0.03), darkGold));
  }

  // mane spikes fanning back along the neck
  const mane = [];
  for (let i = 0; i < 11; i++) {
    const a = -0.9 + (i / 10) * 1.8;
    const p = new THREE.Vector3(-1.2, 0.3 + Math.cos(a) * 0.9, Math.sin(a) * 1.0);
    const dir = new THREE.Vector3(-1, Math.cos(a) * 0.7, Math.sin(a) * 0.9).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    mane.push(compose(p.addScaledVector(dir, 0.9), q, new THREE.Vector3(1, 1.3 + (i % 3) * 0.3, 1)));
  }
  h.add(instances(new THREE.ConeGeometry(0.28, 2, 6), darkGold, mane));

  // whiskers and chin beard
  for (const s of [-1, 1]) {
    const w = new THREE.CatmullRomCurve3([
      new THREE.Vector3(3.6, -0.3, s * 0.55),
      new THREE.Vector3(4.6, -0.6, s * 1.5),
      new THREE.Vector3(5.2, -1.6, s * 2.3),
      new THREE.Vector3(5.0, -2.6, s * 2.6),
    ]);
    h.add(mesh(taperedTube(w, 30, 6, (t) => 0.12 * (1 - t) + 0.02), darkGold));
  }
  const beard = [];
  for (let i = 0; i < 5; i++) {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI + 0.3));
    beard.push(compose(new THREE.Vector3(0.8 + i * 0.35, -1.7, (i - 2) * 0.18), q, new THREE.Vector3(1, 1 + (i % 2) * 0.4, 1)));
  }
  h.add(instances(new THREE.ConeGeometry(0.12, 1.1, 5), darkGold, beard));

  const mouth = new THREE.Object3D();
  mouth.position.set(3.9, -0.75, 0);
  const tip = new THREE.Object3D();
  tip.position.set(5.2, -1.0, 0);
  h.add(mouth, tip);
  h.userData.mouth = mouth;
  h.userData.mouthTip = tip;
  return h;
}
