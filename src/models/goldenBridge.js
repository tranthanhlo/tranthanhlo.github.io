import * as THREE from 'three';
import { mat, glowMat, mesh, instances, compose, roughen, stoneTexture, rng, palette } from './kit.js';
import { taperedTube } from './dragonBridge.js';

const ARC_R = 14;
const WALK_W = 3.0;
const WALK_Y = 9;
const A0 = -1.15, A1 = 1.15;

const SLOPE = { x: -2, rx: 8, ry: 10, rz: 15 };

const onArc = (a, r, y) => new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);

// Cầu Vàng (Golden Bridge, Bà Nà Hills): a 150 m golden walkway held by two giant stone hands
export function goldenBridge() {
  const g = new THREE.Group();
  const rockTex = stoneTexture(11, { moss: 0.3, base: '#8d877c' });
  rockTex.repeat.set(3, 3);
  const rock = mat(0xffffff, { map: rockTex, roughness: 1 });

  // mountainside behind the walkway: a half ellipsoid with a rocky face toward the bridge
  const dome = (seed) => roughen(new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), 0.07, 2.5, seed);
  const slope = mesh(dome(4), palette.sage, { x: SLOPE.x });
  slope.scale.set(SLOPE.rx, SLOPE.ry, SLOPE.rz);
  g.add(slope);
  const cliff = mesh(dome(8), rock, { x: SLOPE.x + 2.6 });
  cliff.scale.set(SLOPE.rx * 0.78, SLOPE.ry * 0.82, SLOPE.rz * 0.8);
  g.add(cliff);
  const ground = mesh(new THREE.CylinderGeometry(16, 16, 0.6, 48), palette.porcelainShade, { x: 2, y: -0.3 });
  g.add(ground);
  g.add(trees());
  // turn the walkway toward the viewer when selected
  g.userData.front = -Math.PI / 2 + 0.35;

  // walkway deck: an annular sector extruded for thickness
  const shape = new THREE.Shape();
  const steps = 64;
  for (let i = 0; i <= steps; i++) {
    const a = A0 + ((A1 - A0) * i) / steps;
    const p = [Math.cos(a) * (ARC_R + WALK_W / 2), Math.sin(a) * (ARC_R + WALK_W / 2)];
    i ? shape.lineTo(...p) : shape.moveTo(...p);
  }
  for (let i = steps; i >= 0; i--) {
    const a = A0 + ((A1 - A0) * i) / steps;
    shape.lineTo(Math.cos(a) * (ARC_R - WALK_W / 2), Math.sin(a) * (ARC_R - WALK_W / 2));
  }
  const deckGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.55, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2, curveSegments: 64 });
  deckGeo.rotateX(Math.PI / 2);
  const gold = glowMat(0xc9a14a, 0xffb52e, 0.7, { metalness: 1, roughness: 0.28 });
  g.add(mesh(deckGeo, gold, { y: WALK_Y }));

  // railings: posts plus a top rail on both edges
  const posts = [];
  for (let i = 0; i <= 90; i++) {
    const a = A0 + ((A1 - A0) * i) / 90;
    for (const r of [ARC_R - WALK_W / 2 + 0.1, ARC_R + WALK_W / 2 - 0.1]) posts.push(compose(onArc(a, r, WALK_Y + 0.5)));
  }
  g.add(instances(new THREE.BoxGeometry(0.07, 0.9, 0.07), gold, posts));
  for (const r of [ARC_R - WALK_W / 2 + 0.1, ARC_R + WALK_W / 2 - 0.1]) {
    const rail = new THREE.CatmullRomCurve3(Array.from({ length: 40 }, (_, i) => onArc(A0 + ((A1 - A0) * i) / 39, r, WALK_Y + 0.95)));
    g.add(mesh(new THREE.TubeGeometry(rail, 80, 0.06, 6), gold));
  }

  // lanterns along the outer rail
  const lantern = glowMat(0xfff4dc, 0xffcf7a, 3);
  const lanterns = [];
  for (let i = 1; i < 12; i++) {
    const a = A0 + ((A1 - A0) * i) / 12;
    lanterns.push(compose(onArc(a, ARC_R + WALK_W / 2 - 0.1, WALK_Y + 1.25)));
  }
  g.add(instances(new THREE.BoxGeometry(0.22, 0.32, 0.22), lantern, lanterns));

  // the two hands, palms up beneath the walkway
  for (const a of [-0.42, 0.42]) {
    const hand = stoneHand(rock, a > 0 ? 1 : -1);
    const p = onArc(a, ARC_R + 0.4, 0);
    hand.position.set(p.x, 0, p.z);
    hand.rotation.y = -a;
    g.add(hand);
  }
  return g;
}

// A forearm rising from the slope with a cupped palm; fingers curl up past the outer edge, thumb on the inner edge.
function stoneHand(rock, side) {
  const h = new THREE.Group();
  const top = WALK_Y - 1.0;

  const armCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3.5, -1, 0),
    new THREE.Vector3(-2.2, top * 0.45, 0),
    new THREE.Vector3(-0.8, top - 2.2, 0),
    new THREE.Vector3(-0.2, top - 0.8, 0),
  ]);
  const armGeo = taperedTube(armCurve, 40, 14, (t) => 2.1 - t * 0.6);
  h.add(mesh(roughen(armGeo, 0.18, 0.9, side * 3), rock));

  // palm: a flattened rounded block
  const palm = mesh(roughen(new THREE.SphereGeometry(1.9, 18, 12), 0.12, 1.4, side), rock, { x: 0.5, y: top - 0.2 });
  palm.scale.set(1.4, 0.6, 1.3);
  h.add(palm);

  // four fingers, three segments each, curling up around the outer edge of the deck
  const spread = [-1.5, -0.5, 0.5, 1.5];
  spread.forEach((z, f) => {
    const len = f === 1 || f === 2 ? 1.0 : 0.85;
    let p = new THREE.Vector3(2.3, top, z * 0.95);
    let angle = 0.25;
    for (let k = 0; k < 3; k++) {
      const segLen = (1.5 - k * 0.22) * len;
      const r = 0.52 - k * 0.08;
      const dir = new THREE.Vector3(Math.cos(angle), Math.sin(angle), z * 0.04);
      const end = p.clone().addScaledVector(dir, segLen);
      const seg = new THREE.CatmullRomCurve3([p, end]);
      h.add(mesh(taperedTube(seg, 4, 10, () => r), rock));
      h.add(mesh(new THREE.SphereGeometry(r * 1.02, 10, 8), rock, { x: end.x, y: end.y, z: end.z }));
      p = end;
      angle += 0.55;
    }
  });

  // thumb on the inner side
  const thumb = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.6, top, 0),
    new THREE.Vector3(-1.4, top + 0.9, 0),
    new THREE.Vector3(-1.6, top + 2.0, 0),
  ]);
  h.add(mesh(taperedTube(thumb, 12, 10, (t) => 0.55 - t * 0.15), rock));
  return h;
}

function trees() {
  const r = rng(21);
  const trunks = [], crowns = [];
  for (let i = 0; i < 160 && trunks.length < 60; i++) {
    // scatter on the back and sides of the slope, away from the walkway
    const x = SLOPE.x - SLOPE.rx + r() * SLOPE.rx * 1.3;
    const z = (r() * 2 - 1) * SLOPE.rz;
    const k = 1 - ((x - SLOPE.x) / SLOPE.rx) ** 2 - (z / SLOPE.rz) ** 2;
    if (k < 0.04) continue;
    const y = SLOPE.ry * Math.sqrt(k) - 0.3;
    if (y > SLOPE.ry * 0.85) continue;
    const ground = new THREE.Vector3(x, 0, z);
    const s = 0.7 + r() * 0.6;
    trunks.push(compose(ground.clone().setY(y + 0.4 * s), undefined, new THREE.Vector3(s, s, s)));
    crowns.push(compose(ground.clone().setY(y + 1.5 * s), undefined, new THREE.Vector3(s, s * (1 + r() * 0.4), s)));
  }
  const grp = new THREE.Group();
  grp.add(instances(new THREE.CylinderGeometry(0.1, 0.14, 0.8, 5), palette.porcelainShade, trunks));
  grp.add(instances(new THREE.ConeGeometry(0.7, 2, 7), palette.sage, crowns));
  return grp;
}
