import * as THREE from 'three';
import { makeRenderer, onResize, glowPoints, fibonacciSphere } from './three-utils.js';

// A breathing neural sphere: nodes, nearest-neighbour synapses, travelling signal pulses, orbit rings and stars.
export function createHero(container, { reduced }) {
  const renderer = makeRenderer(container);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  camera.position.set(0, 0, 10);

  const tilt = new THREE.Group();
  const core = new THREE.Group();
  tilt.add(core);
  scene.add(tilt);

  // nodes
  const N = 340, R = 3;
  const base = fibonacciSphere(N).map((v) => v.multiplyScalar(R * (0.88 + Math.random() * 0.24)));
  const phase = base.map(() => Math.random() * Math.PI * 2);
  const cA = new THREE.Color('#22d3ee'), cB = new THREE.Color('#a78bfa'), cC = new THREE.Color('#f472b6');
  const nodeColors = base.map((v) => {
    const k = THREE.MathUtils.clamp((v.y / R + 1) / 2, 0, 1);
    return k < 0.5 ? cA.clone().lerp(cB, k * 2) : cB.clone().lerp(cC, (k - 0.5) * 2);
  });
  const nodeSizes = base.map(() => (Math.random() < 0.06 ? 10 : 2.5 + Math.random() * 3));
  const nodes = glowPoints(N, nodeColors, nodeSizes);
  const nodePos = nodes.geometry.attributes.position.array;
  core.add(nodes);

  // edges to the 3 nearest neighbours
  const edges = [];
  const seen = new Set();
  for (let i = 0; i < N; i++) {
    const near = base.map((v, j) => [j, v.distanceToSquared(base[i])]).filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]).slice(0, 3);
    for (const [j] of near) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!seen.has(key)) { seen.add(key); edges.push([i, j]); }
    }
  }
  const linePos = new Float32Array(edges.length * 6);
  const lineCol = new Float32Array(edges.length * 6);
  edges.forEach(([a, b], e) => {
    lineCol.set([nodeColors[a].r, nodeColors[a].g, nodeColors[a].b, nodeColors[b].r, nodeColors[b].g, nodeColors[b].b], e * 6);
  });
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  lineGeo.setAttribute('color', new THREE.BufferAttribute(lineCol, 3));
  const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  lines.frustumCulled = false;
  core.add(lines);

  // signal pulses travelling along edges
  const P = 60;
  const pulses = Array.from({ length: P }, () => ({ e: (Math.random() * edges.length) | 0, t: Math.random(), s: 0.6 + Math.random() * 1.4 }));
  const pulsePts = glowPoints(P, new THREE.Color('#e0fbff'), 7);
  const pulsePos = pulsePts.geometry.attributes.position.array;
  core.add(pulsePts);

  // inner core
  const ico = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.15, 1)),
    new THREE.LineBasicMaterial({ color: '#a78bfa', transparent: true, opacity: 0.5 }),
  );
  core.add(ico);
  const coreGlow = glowPoints(1, new THREE.Color('#7c3aed'), 160, 0.55);
  core.add(coreGlow);

  // orbit rings with satellites
  const rings = [];
  [[4.1, '#22d3ee', 1.1, 0.3], [4.7, '#a78bfa', -0.6, 1.2], [5.3, '#f472b6', 0.4, -0.9]].forEach(([r, color, rx, rz], i) => {
    const g = new THREE.Group();
    g.rotation.set(rx, 0, rz);
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.008, 6, 240),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 }),
    );
    g.add(torus);
    const sat = glowPoints(1, new THREE.Color(color), 16);
    g.add(sat);
    tilt.add(g);
    rings.push({ g, sat, r, speed: 0.25 + i * 0.12, a: Math.random() * 6 });
  });

  // stars
  const S = 1500;
  const stars = glowPoints(S, Array.from({ length: S }, () => new THREE.Color().setHSL(0.55 + Math.random() * 0.2, 0.6, 0.75 + Math.random() * 0.25)),
    Array.from({ length: S }, () => 1.5 + Math.random() * 3), 0.75);
  const sp = stars.geometry.attributes.position.array;
  for (let i = 0; i < S; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(18 + Math.random() * 40);
    sp[i * 3] = v.x; sp[i * 3 + 1] = v.y; sp[i * 3 + 2] = v.z;
  }
  scene.add(stars);

  // input
  const mouse = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  let wide = true;
  onResize(container, (w, h) => {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    wide = w > 900;
    tilt.position.x = wide ? 3.3 : 0;
    tilt.position.y = wide ? 0 : 1.2;
    tilt.scale.setScalar(wide ? 1 : 0.78);
  });

  const motion = reduced ? 0.15 : 1;
  container.classList.add('ready');

  function tick(t, dt) {
    core.rotation.y += dt * 0.12 * motion;
    core.rotation.z = Math.sin(t * 0.2) * 0.12 * motion;
    ico.rotation.x -= dt * 0.3 * motion;
    ico.rotation.y += dt * 0.2 * motion;
    tilt.rotation.x += (mouse.y * 0.35 - tilt.rotation.x) * 0.04;
    tilt.rotation.y += (mouse.x * 0.5 - tilt.rotation.y) * 0.04;

    for (let i = 0; i < N; i++) {
      const w = 1 + Math.sin(t * 1.3 + phase[i]) * 0.04 * motion;
      nodePos[i * 3] = base[i].x * w;
      nodePos[i * 3 + 1] = base[i].y * w;
      nodePos[i * 3 + 2] = base[i].z * w;
    }
    nodes.geometry.attributes.position.needsUpdate = true;

    for (let e = 0; e < edges.length; e++) {
      const a = edges[e][0] * 3, b = edges[e][1] * 3, o = e * 6;
      linePos[o] = nodePos[a]; linePos[o + 1] = nodePos[a + 1]; linePos[o + 2] = nodePos[a + 2];
      linePos[o + 3] = nodePos[b]; linePos[o + 4] = nodePos[b + 1]; linePos[o + 5] = nodePos[b + 2];
    }
    lineGeo.attributes.position.needsUpdate = true;

    pulses.forEach((p, i) => {
      p.t += dt * p.s * motion;
      if (p.t > 1) { p.t = 0; p.e = (Math.random() * edges.length) | 0; }
      const a = edges[p.e][0] * 3, b = edges[p.e][1] * 3;
      for (let c = 0; c < 3; c++) pulsePos[i * 3 + c] = nodePos[a + c] + (nodePos[b + c] - nodePos[a + c]) * p.t;
    });
    pulsePts.geometry.attributes.position.needsUpdate = true;

    rings.forEach((r) => {
      r.a += dt * r.speed * motion;
      const p = r.sat.geometry.attributes.position.array;
      p[0] = Math.cos(r.a) * r.r; p[1] = Math.sin(r.a) * r.r;
      r.sat.geometry.attributes.position.needsUpdate = true;
      r.g.rotation.y += dt * 0.05 * motion;
    });

    stars.rotation.y = t * 0.008 * motion;
    stars.rotation.x = t * 0.003 * motion;

    // scroll: drift the camera back and down as the hero leaves
    const s = THREE.MathUtils.clamp(scrollY / innerHeight, 0, 1.2);
    camera.position.z = 10 + s * 6;
    camera.position.y = -s * 2;
    renderer.render(scene, camera);
  }

  return { tick };
}
