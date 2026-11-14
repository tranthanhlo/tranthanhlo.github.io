import * as THREE from 'three';
import { box, mesh, glowMat, instances, compose, palette } from './kit.js';
import { riverBase, railings } from './riverBase.js';

// Cầu Thuận Phước: suspension bridge at the mouth of the Han River, with portal towers,
// sagging main cables, vertical hangers and concrete anchor blocks at both ends.
export function suspensionBridge() {
  const g = new THREE.Group();
  const L = 74, deckY = 4.2, W = 6, TX = 16, TOP = deckY + 17, ANCHOR = 34;
  riverBase(g, { length: L + 4, depth: 18, bankTop: deckY - 0.6, bank: 7 });

  // deck: steel box girder with a porcelain road slab
  g.add(box(L, 0.9, W, palette.porcelainShade, { y: deckY - 0.45 }));
  g.add(box(L, 0.04, W - 1.4, palette.asphalt, { y: deckY + 0.02, shadow: false }));
  railings(g, { length: L, y: deckY, halfWidth: W / 2 - 0.1 });

  // portal towers: tapered legs with three cross beams
  const towerGlow = glowMat(0xe8e4dc, 0xffe0a0, 0.9, { roughness: 0.55 });
  for (const tx of [-TX, TX]) {
    for (const z of [-W / 2 - 0.3, W / 2 + 0.3]) {
      g.add(mesh(new THREE.CylinderGeometry(0.45, 0.7, TOP + 0.6, 4, 1), palette.porcelain, { x: tx, y: (TOP + 0.6) / 2, z }).rotateY(Math.PI / 4));
    }
    for (const [y, h] of [[TOP, 0.9], [deckY + 9, 0.7], [deckY - 1.2, 0.8]]) g.add(box(0.9, h, W + 1.2, palette.porcelain, { x: tx, y }));
    g.add(box(1.0, 0.3, W + 1.4, towerGlow, { x: tx, y: TOP + 0.6, shadow: false }));
  }

  // anchor blocks
  for (const s of [-1, 1]) g.add(box(4, 3.4, W + 2, palette.porcelainShade, { x: s * ANCHOR, y: deckY + 0.6 }));

  // main cables: a parabola between the towers and straight backstays to the anchors
  const sagLow = deckY + 1.6;
  const cableY = (x) => {
    const ax = Math.abs(x);
    if (ax <= TX) return sagLow + (TOP - sagLow) * (x / TX) ** 2;
    return TOP - ((ax - TX) / (ANCHOR - TX)) * (TOP - (deckY + 1.6));
  };
  const cableMat = glowMat(0xb9bec4, 0xffd27a, 0.6, { metalness: 0.9, roughness: 0.35 });
  const hangers = [];
  for (const z of [-W / 2 - 0.3, W / 2 + 0.3]) {
    const pts = [];
    for (let x = -ANCHOR; x <= ANCHOR; x += 0.5) pts.push(new THREE.Vector3(x, cableY(x), z));
    g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 300, 0.12, 6), cableMat));
    for (let x = -TX + 1; x < TX; x += 1) {
      const h = cableY(x) - deckY;
      hangers.push(compose(new THREE.Vector3(x, deckY + h / 2, z), undefined, new THREE.Vector3(1, h, 1)));
    }
  }
  g.add(instances(new THREE.CylinderGeometry(0.025, 0.025, 1, 4), palette.steel, hangers));
  return g;
}
