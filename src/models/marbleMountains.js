import * as THREE from 'three';
import { mesh, box, mat, glowMat, instances, compose, roughen, stoneTexture, rng, palette } from './kit.js';

// Ngũ Hành Sơn: five limestone and marble peaks (Kim, Mộc, Thủy, Hỏa, Thổ) with a cave mouth,
// a seven-tier tower on the main peak, and greenery on the summits.
// userData.peaks marks where the skill labels go.
export function marbleMountains() {
  const g = new THREE.Group();
  const tex = stoneTexture(23, { moss: 0.15, base: '#c9c2b5' });
  tex.repeat.set(2, 2);
  const marble = mat(0xffffff, { map: tex, roughness: 0.75, flatShading: true });

  g.add(mesh(new THREE.CylinderGeometry(19, 19.4, 0.6, 72), palette.porcelainShade, { y: -0.3 }));

  // karst towers: taller than they are wide
  const peaks = [
    { x: 0, z: 0, r: 5.2, h: 15 },
    { x: -12, z: 6, r: 3.2, h: 9 },
    { x: 10.5, z: -7, r: 3.6, h: 11 },
    { x: 9.5, z: 9.5, r: 2.8, h: 7.5 },
    { x: -8.5, z: -10, r: 3.1, h: 9.5 },
  ];
  const r = rng(31);
  g.userData.peaks = [];
  const greens = [];
  peaks.forEach((p, i) => {
    // a tall, craggy karst: stretched icosphere with layered noise
    const geo = roughen(roughen(new THREE.IcosahedronGeometry(1, 3), 0.28, 1.5, i * 9), 0.08, 4, i * 3 + 1);
    const rock = mesh(geo, marble, { x: p.x, y: p.h * 0.42, z: p.z });
    rock.scale.set(p.r, p.h * 0.55, p.r * 0.85);
    rock.rotation.y = r() * Math.PI;
    g.add(rock);
    // greenery clinging to the upper slopes
    for (let k = 0; k < 9; k++) {
      const a = r() * Math.PI * 2;
      const up = 0.45 + r() * 0.45;
      const rad = p.r * Math.sqrt(1 - up * up) * 0.95;
      const s = 0.3 + r() * 0.4;
      greens.push(compose(new THREE.Vector3(p.x + Math.cos(a) * rad, p.h * 0.42 + up * p.h * 0.55, p.z + Math.sin(a) * rad * 0.85), undefined, new THREE.Vector3(s, s * 0.7, s)));
    }
    const marker = new THREE.Object3D();
    marker.position.set(p.x, p.h * 0.42 + p.h * 0.55 + 1.2, p.z);
    g.add(marker);
    g.userData.peaks.push(marker);
  });
  g.add(instances(new THREE.IcosahedronGeometry(1, 1), palette.sage, greens));

  // cave mouth at the foot of the main peak
  const cave = mesh(new THREE.CylinderGeometry(1.4, 1.4, 1.2, 24, 1, false, 0, Math.PI), mat(0x050506, { roughness: 1 }), { x: 0, y: 0, z: 4.3 });
  cave.rotation.set(Math.PI / 2, 0, 0);
  g.add(cave);
  g.add(box(3.4, 0.25, 2.6, palette.porcelain, { y: 0.12, z: 6.0 }));
  for (let k = 0; k < 5; k++) g.add(box(2.4, 0.18, 0.5, palette.porcelain, { y: 0.09 + k * 0.18, z: 7.8 - k * 0.5 }));

  // seven-tier tower near the summit of the main peak
  const tower = new THREE.Group();
  const roof = palette.goldDark;
  const lit = glowMat(0xe8e4dc, 0xffd38a, 1.2, { roughness: 0.5 });
  let y = 0;
  for (let t = 0; t < 7; t++) {
    const w = 1.3 - t * 0.13;
    tower.add(box(w, 0.42, w, lit, { y: y + 0.21 }));
    const eave = mesh(new THREE.ConeGeometry(w * 0.95, 0.28, 4), roof, { y: y + 0.52 });
    eave.rotation.y = Math.PI / 4;
    tower.add(eave);
    y += 0.62;
  }
  tower.add(mesh(new THREE.ConeGeometry(0.08, 0.7, 6), palette.gold, { y: y + 0.3 }));
  // just below the summit of the main peak (centre 0.42h, vertical radius 0.55h)
  tower.position.set(1.0, peaks[0].h * (0.42 + 0.55 * 0.88), 1.0);
  g.add(tower);
  return g;
}
