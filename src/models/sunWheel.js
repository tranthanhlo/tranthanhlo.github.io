import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mesh, box, glowMat, lines, instances, compose, palette } from './kit.js';

// Sun Wheel (Asia Park), 115 m: twin-ring truss rim, cable spokes, 64 cabins that stay level,
// A-frame supports on a plaza. userData.update turns the wheel.
export function sunWheel() {
  const g = new THREE.Group();
  const R = 10, HUB = 12, RING_Z = 0.7, N = 64;

  // plaza with planting beds
  g.add(mesh(new THREE.CylinderGeometry(15, 15.4, 0.6, 64), palette.porcelainShade, { y: -0.3 }));
  g.add(mesh(new THREE.CylinderGeometry(6, 6, 0.08, 48), palette.porcelain, { y: 0.04 }));
  for (const s of [-1, 1]) g.add(box(9, 0.4, 2.2, palette.sage, { x: s * 9, y: 0.2, z: 6 }));

  // A-frame supports meeting at the hub
  for (const z of [-1.6, 1.6]) {
    for (const s of [-1, 1]) {
      const leg = mesh(new THREE.CylinderGeometry(0.22, 0.32, HUB / Math.cos(0.3), 10), palette.porcelain, { x: s * Math.tan(0.3) * HUB / 2, y: HUB / 2, z });
      leg.rotation.z = s * 0.3;
      g.add(leg);
    }
    g.add(box(Math.tan(0.3) * HUB * 0.9, 0.25, 0.3, palette.porcelain, { y: HUB * 0.35, z }));
  }
  g.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 3.6, 16), palette.steel, { y: HUB }).rotateX(Math.PI / 2));

  const wheel = new THREE.Group();
  wheel.position.y = HUB;
  g.add(wheel);

  // twin rings joined by a zig-zag truss
  const rim = glowMat(0xd7c08a, 0xffc66b, 1.4, { metalness: 1, roughness: 0.3 });
  for (const z of [-RING_Z, RING_Z]) wheel.add(mesh(new THREE.TorusGeometry(R, 0.11, 8, 160), rim, { z }));
  wheel.add(mesh(new THREE.TorusGeometry(R - 0.9, 0.06, 6, 160), rim));
  const truss = [];
  for (let i = 0; i < N * 2; i++) {
    const a0 = (i / (N * 2)) * Math.PI * 2, a1 = ((i + 1) / (N * 2)) * Math.PI * 2;
    const z0 = i % 2 ? RING_Z : -RING_Z;
    truss.push(new THREE.Vector3(Math.cos(a0) * R, Math.sin(a0) * R, z0), new THREE.Vector3(Math.cos(a1) * R, Math.sin(a1) * R, -z0));
  }
  wheel.add(lines(truss, 0xc9b07a, 0xffd38a));

  // cable spokes from both ends of the hub
  const spokes = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const p = new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, 0);
    spokes.push(new THREE.Vector3(0, 0, -1.6), p.clone().setZ(-RING_Z), new THREE.Vector3(0, 0, 1.6), p.clone().setZ(RING_Z));
  }
  wheel.add(lines(spokes, 0xaeb4ba, 0xf7d9a0));
  wheel.add(mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.2, 24), palette.gold).rotateX(Math.PI / 2));

  // cabins hang below their pivots on the rim; positions are rewritten each frame so they stay level
  const cabinGeo = new RoundedBoxGeometry(0.55, 0.6, 0.55, 3, 0.12);
  const cabinMat = glowMat(0xf2efe8, 0xfff0cf, 0.8, { roughness: 0.25, metalness: 0.1 });
  const cabins = instances(cabinGeo, cabinMat, Array.from({ length: N }, () => compose(new THREE.Vector3())));
  g.add(cabins);

  let angle = 0;
  const p = new THREE.Vector3();
  const placeCabins = () => {
    for (let i = 0; i < N; i++) {
      const a = angle + (i / N) * Math.PI * 2;
      p.set(Math.cos(a) * (R + 0.15), HUB + Math.sin(a) * (R + 0.15) - 0.45, 0);
      cabins.setMatrixAt(i, compose(p));
    }
    cabins.instanceMatrix.needsUpdate = true;
  };
  placeCabins();
  g.userData.update = (dt) => {
    angle += dt * 0.08;
    wheel.rotation.z = angle;
    placeCabins();
  };
  return g;
}
