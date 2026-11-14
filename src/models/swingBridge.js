import * as THREE from 'three';
import { box, mesh, glowMat, lines, palette } from './kit.js';
import { riverBase, railings, streetLamps } from './riverBase.js';

// Cầu sông Hàn: Vietnam's first swing bridge. The central cable-stayed span turns on two
// round pivot piers to let ships through at night.
export function swingBridge() {
  const g = new THREE.Group();
  const L = 58, deckY = 3.4, W = 5;
  riverBase(g, { length: L + 6, bankTop: deckY - 0.4 });

  // deck: fixed approach spans and the swing span, separated by thin joints
  for (const [x0, x1] of [[-L / 2, -15.2], [-14.8, 14.8], [15.2, L / 2]]) {
    g.add(box(x1 - x0, 0.9, W, palette.porcelain, { x: (x0 + x1) / 2, y: deckY - 0.45 }));
  }
  g.add(box(L, 0.04, W - 1.2, palette.asphalt, { y: deckY + 0.02, shadow: false }));
  railings(g, { length: L, y: deckY, halfWidth: W / 2 - 0.1 });
  streetLamps(g, { from: -L / 2 + 4, to: L / 2 - 4, y: deckY, halfWidth: W / 2 - 0.15, every: 7 });

  // approach piers and the two round pivot piers
  for (const x of [-24, -19, 19, 24]) g.add(box(1.2, deckY - 0.9, W - 1.4, palette.porcelainShade, { x, y: (deckY - 0.9) / 2 }));
  for (const x of [-7, 7]) {
    g.add(mesh(new THREE.CylinderGeometry(2.4, 2.6, deckY - 0.9, 32), palette.porcelainShade, { x, y: (deckY - 0.9) / 2 }));
    g.add(mesh(new THREE.CylinderGeometry(2.7, 2.7, 0.25, 32), palette.steel, { x, y: deckY - 1.0 }));
  }

  // two H-shaped pylons over the pivots with fanned stay cables on both faces
  const stays = [];
  const top = deckY + 9;
  for (const px of [-7, 7]) {
    for (const z of [-W / 2 + 0.2, W / 2 - 0.2]) {
      const leg = mesh(new THREE.CylinderGeometry(0.16, 0.26, top - deckY, 10), palette.porcelain, { x: px, y: (deckY + top) / 2, z });
      g.add(leg);
      for (let k = 1; k <= 6; k++) {
        const anchor = new THREE.Vector3(px, top - 0.4 - k * 0.55, z);
        stays.push(anchor, new THREE.Vector3(px - k * 1.15, deckY + 0.1, z));
        stays.push(anchor, new THREE.Vector3(px + k * 1.15, deckY + 0.1, z));
      }
    }
    g.add(box(0.3, 0.35, W - 0.2, palette.porcelain, { x: px, y: top - 0.2 }));
    g.add(box(0.3, 0.3, W - 0.2, palette.porcelain, { x: px, y: deckY + 4.4 }));
  }
  g.add(lines(stays, 0xd8dde2, 0x7fd8ff));

  // LED strips along the deck edges, the bridge's night signature
  const led = glowMat(0x1d2630, 0x38c6ff, 2.6);
  for (const z of [-W / 2 - 0.02, W / 2 + 0.02]) g.add(box(L, 0.12, 0.05, led, { y: deckY - 0.75, z, shadow: false }));
  return g;
}
