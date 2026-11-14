import * as THREE from 'three';
import { box, instances, compose, glowMat, mesh, palette } from './kit.js';

// Black-glass river between two porcelain embankments, shared by the river bridges.
export function riverBase(g, { length, depth = 16, bankTop = 2.6, bank = 4 }) {
  g.add(box(length, 0.6, depth, palette.darkWater, { y: -0.3 }));
  for (const s of [-1, 1]) {
    g.add(box(bank, bankTop, depth, palette.porcelainShade, { x: s * (length / 2 - bank / 2), y: bankTop / 2 }));
    g.add(box(bank, 0.12, depth, palette.porcelain, { x: s * (length / 2 - bank / 2), y: bankTop + 0.06 }));
  }
}

// Steel railing posts plus a top rail along both deck edges
export function railings(g, { length, y, halfWidth, step = 0.8 }) {
  const posts = [];
  for (let x = -length / 2; x <= length / 2; x += step) {
    for (const z of [-halfWidth, halfWidth]) posts.push(compose(new THREE.Vector3(x, y + 0.35, z)));
  }
  g.add(instances(new THREE.BoxGeometry(0.06, 0.7, 0.06), palette.steel, posts));
  for (const z of [-halfWidth, halfWidth]) g.add(box(length, 0.06, 0.1, palette.steel, { y: y + 0.72, z, shadow: false }));
}

// Street lamps that glow when the landmark lights are on
export function streetLamps(g, { from, to, y, halfWidth, every = 6 }) {
  const glow = glowMat(0xfff3d6, 0xffd27a, 3);
  for (let x = from; x <= to; x += every) {
    for (const s of [-1, 1]) {
      g.add(mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.2, 6), palette.steel, { x, y: y + 1.1, z: s * halfWidth }));
      g.add(box(0.6, 0.05, 0.06, palette.steel, { x, y: y + 2.2, z: s * (halfWidth - 0.28) }));
      g.add(box(0.3, 0.1, 0.18, glow, { x, y: y + 2.13, z: s * (halfWidth - 0.55), shadow: false }));
    }
  }
}
