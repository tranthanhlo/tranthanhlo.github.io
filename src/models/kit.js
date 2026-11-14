import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// Materials that light up at night register here:
// { mat, night } for emissive meshes, { line, day, nightColor } for line colors.
export const nightLights = [];

export function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...opts });
}

// Shared museum-maquette palette so every model reads as one set:
// porcelain structure, black glass water, gold accents, brushed steel cables, warm stone.
export const palette = {
  porcelain: mat(0xd8d3c9, { roughness: 0.6 }),
  porcelainShade: mat(0xb9b3a8, { roughness: 0.65 }),
  // matte enough that the key light doesn't flare off it into the bloom
  darkWater: new THREE.MeshStandardMaterial({ color: 0x0b0f14, roughness: 0.5, metalness: 0.3, envMapIntensity: 0.4 }),
  gold: mat(0xc9a14a, { metalness: 1, roughness: 0.28 }),
  goldDark: mat(0x9c7a2e, { metalness: 1, roughness: 0.35 }),
  steel: mat(0xb9bec4, { metalness: 0.9, roughness: 0.35 }),
  stone: mat(0x8d877c, { roughness: 0.9 }),
  sage: mat(0x9aa595, { roughness: 0.85 }),
  asphalt: mat(0x2a2c30, { roughness: 0.9 }),
};

export function glowMat(color, emissive, night, opts = {}) {
  const m = mat(color, { emissive, emissiveIntensity: 0, ...opts });
  nightLights.push({ mat: m, night });
  return m;
}

export function mesh(geo, material, { x = 0, y = 0, z = 0, shadow = true } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

export function box(w, h, d, material, pos) {
  return mesh(new THREE.BoxGeometry(w, h, d), material, pos);
}

export function lines(points, color, night = color) {
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const m = new THREE.LineBasicMaterial({ color });
  nightLights.push({ line: m, day: new THREE.Color(color), nightColor: new THREE.Color(night) });
  return new THREE.LineSegments(geo, m);
}

// One InstancedMesh from a list of matrices
export function instances(geo, material, matrices) {
  const im = new THREE.InstancedMesh(geo, material, matrices.length);
  matrices.forEach((m, i) => im.setMatrixAt(i, m));
  im.castShadow = im.receiveShadow = true;
  return im;
}

export function compose(pos, quat = new THREE.Quaternion(), scale = new THREE.Vector3(1, 1, 1)) {
  return new THREE.Matrix4().compose(pos, quat, scale);
}

// Deterministic pseudo-random so models look the same on every load
export function rng(seed = 1) {
  let s = seed % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

// Smooth 3D value noise, used to roughen rock surfaces without tearing faces
export function noise3(x, y, z) {
  const h = (i, j, k) => {
    const n = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const s = (t) => t * t * (3 - 2 * t);
  const u = s(xf), v = s(yf), w = s(zf);
  const lerp = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => h(xi + dx, yi + dy, zi + dz);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  );
}

// Displace a geometry along its normals with noise. Non-indexed input (icospheres) is welded
// first, otherwise each face moves along its own normal and the surface tears.
export function roughen(geo, amount, freq, seed = 0) {
  if (!geo.index) {
    geo.deleteAttribute('normal');
    geo.deleteAttribute('uv');
    geo = mergeVertices(geo);
  }
  const pos = geo.attributes.position;
  geo.computeVertexNormals();
  const nrm = geo.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n = noise3(x * freq + seed, y * freq, z * freq) * 0.7 + noise3(x * freq * 2.7, y * freq * 2.7 + seed, z * freq * 2.7) * 0.3;
    const d = (n - 0.5) * 2 * amount;
    pos.setXYZ(i, x + nrm.getX(i) * d, y + nrm.getY(i) * d, z + nrm.getZ(i) * d);
  }
  geo.computeVertexNormals();
  return geo;
}

// Canvas texture helper
export function canvasTexture(w, h, draw, { repeat = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 4;
  return t;
}

// Weathered stone with cracks and moss patches
export function stoneTexture(seed = 3, { moss = 0.35, base = '#8a857a' } = {}) {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const r = rng(seed);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const v = 100 + r() * 70;
      ctx.fillStyle = `rgba(${v},${v - 4},${v - 12},0.25)`;
      ctx.fillRect(r() * w, r() * h, 2 + r() * 5, 2 + r() * 5);
    }
    for (let i = 0; i < 40 * moss; i++) {
      ctx.fillStyle = `rgba(${70 + r() * 30},${105 + r() * 40},${50 + r() * 20},${0.25 + r() * 0.35})`;
      ctx.beginPath();
      ctx.ellipse(r() * w, r() * h, 6 + r() * 26, 4 + r() * 14, r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(40,36,30,0.45)';
    for (let i = 0; i < 9; i++) {
      ctx.lineWidth = 0.6 + r();
      ctx.beginPath();
      let x = r() * w, y = r() * h;
      ctx.moveTo(x, y);
      for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 40; y += r() * 30; ctx.lineTo(x, y); }
      ctx.stroke();
    }
  });
}
