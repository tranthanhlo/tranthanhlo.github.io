import * as THREE from 'three';

// Fire breathed from the dragon's mouth. Positions are in world space, read from two
// markers on the head (mouth and a point in front of it) so the jet follows the model.
export function dragonFire(scene) {
  const N = 700;
  const pos = new Float32Array(N * 3).fill(-999);
  const vel = new Float32Array(N * 3);
  const life = new Float32Array(N);
  const col = new Float32Array(N * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.32, vertexColors: true, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  points.frustumCulled = false;
  scene.add(points);

  const light = new THREE.PointLight(0xff7a1a, 0, 12, 1.5);
  scene.add(light);

  let until = 0, cursor = 0;
  const from = new THREE.Vector3(), to = new THREE.Vector3(), dir = new THREE.Vector3();
  const hot = new THREE.Color(0xfff1a8), mid = new THREE.Color(0xff8a1c), cool = new THREE.Color(0x8a1c00);
  const c = new THREE.Color();

  return {
    start(seconds = 4) {
      until = performance.now() / 1000 + seconds;
    },
    update(dt, now, mouth, tip) {
      const active = now < until && mouth && tip;
      if (active) {
        mouth.getWorldPosition(from);
        tip.getWorldPosition(to);
        dir.subVectors(to, from);
        // the marker gap is ~1.3 model units, so it tells how big the dragon is drawn
        const scale = dir.length();
        dir.normalize();
        points.material.size = scale * 0.9;
        for (let k = 0; k < 18; k++) {
          const i = cursor++ % N;
          pos.set([from.x, from.y, from.z], i * 3);
          const spread = 0.35;
          vel.set([
            (dir.x + (Math.random() - 0.5) * spread) * scale * 8,
            (dir.y + (Math.random() - 0.4) * spread) * scale * 8,
            (dir.z + (Math.random() - 0.5) * spread) * scale * 8,
          ], i * 3);
          life[i] = 0.55 + Math.random() * 0.3;
        }
        light.position.copy(to);
      }
      light.intensity += ((active ? 12 : 0) - light.intensity) * Math.min(1, dt * 8);
      for (let i = 0; i < N; i++) {
        if (life[i] <= 0) continue;
        life[i] -= dt;
        if (life[i] <= 0) { pos[i * 3 + 1] = -999; continue; }
        pos[i * 3] += vel[i * 3] * dt;
        pos[i * 3 + 1] += vel[i * 3 + 1] * dt + dt * 0.6;
        pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        const k = life[i] / 0.85;
        if (k > 0.6) c.copy(mid).lerp(hot, (k - 0.6) / 0.4);
        else c.copy(cool).lerp(mid, k / 0.6);
        col.set([c.r, c.g, c.b], i * 3);
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
    },
  };
}
