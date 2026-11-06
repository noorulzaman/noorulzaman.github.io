import * as THREE from 'three';
import { glowPoints } from './three-utils.js';

// One small 3D model per journey station, each acting out what that project does.
// Every builder returns { group, update(t, dt, active) } where active eases 0..1 when the station is in view.

const C = (hex) => new THREE.Color(hex);
const std = (color, extra = {}) => new THREE.MeshStandardMaterial({
  color, emissive: color, emissiveIntensity: 0.35, roughness: 0.35, metalness: 0.25, ...extra,
});
const basic = (color, opacity = 1, extra = {}) => new THREE.MeshBasicMaterial({
  color, transparent: true, opacity, depthWrite: opacity >= 1, ...extra,
});
const edges = (geo, color, opacity = 0.8) => new THREE.LineSegments(
  new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
);
const lineOf = (pts, color, opacity = 0.6) => new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
);
const ease = (x) => x * x * (3 - 2 * x);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const rnd = (a, b) => a + Math.random() * (b - a);

function setPos(points, i, x, y, z) {
  const p = points.geometry.attributes.position.array;
  p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z;
}
function setSize(points, i, s) { points.geometry.attributes.aSize.array[i] = s; }
function setColor(points, i, c) {
  const a = points.geometry.attributes.aColor.array;
  a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b;
}
function dirty(points, ...names) { names.forEach((n) => { points.geometry.attributes[n].needsUpdate = true; }); }

function ringLoop(r, color, opacity, seg = 64) {
  const pts = [];
  for (let i = 0; i <= seg; i++) { const a = (i / seg) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
  return lineOf(pts, color, opacity);
}

/* ---------- education: stacked books ---------- */
function books(color) {
  const group = new THREE.Group();
  const stack = [color, '#a78bfa', '#38bdf8'].map((c, i) => {
    const geo = new THREE.BoxGeometry(1.8 - i * 0.18, 0.28, 1.25 - i * 0.1);
    const m = new THREE.Mesh(geo, std(c, { emissiveIntensity: 0.25 }));
    m.position.y = i * 0.31 - 0.35;
    m.add(edges(geo, '#ffffff', 0.25));
    group.add(m);
    return m;
  });
  const N = 30;
  const sparks = glowPoints(N, C(color), Array.from({ length: N }, () => rnd(4, 9)));
  group.add(sparks);
  return {
    group,
    update(t) {
      stack.forEach((m, i) => { m.rotation.y = (i - 1) * 0.3 + Math.sin(t * 0.6 + i) * 0.18; });
      for (let k = 0; k < N; k++) {
        const a = t * 0.7 + (k / N) * Math.PI * 2;
        const r = 1.5 + Math.sin(t * 1.3 + k) * 0.15;
        setPos(sparks, k, Math.cos(a) * r, 0.1 + Math.sin(a * 2 + k) * 0.6, Math.sin(a) * r);
      }
      dirty(sparks, 'position');
    },
  };
}

/* ---------- graduation cap with confetti ---------- */
function cap(color) {
  const group = new THREE.Group();
  const boardGeo = new THREE.BoxGeometry(2, 0.08, 2);
  const board = new THREE.Mesh(boardGeo, std('#1e293b', { emissive: C(color), emissiveIntensity: 0.12 }));
  board.position.y = 0.5;
  board.rotation.y = Math.PI / 4;
  board.add(edges(boardGeo, color, 0.9));
  group.add(board);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.55, 40), std('#1e293b', { emissive: C(color), emissiveIntensity: 0.15 }));
  base.position.y = 0.2;
  group.add(base);
  const button = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), std(color));
  button.position.y = 0.58;
  group.add(button);
  const pivot = new THREE.Group();
  pivot.position.set(0, 0.58, 0);
  group.add(pivot);
  pivot.add(lineOf([new THREE.Vector3(0, 0, 0), new THREE.Vector3(1.35, 0, 0), new THREE.Vector3(1.35, -0.7, 0)], color, 0.9));
  const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 12), std(color));
  tassel.position.set(1.35, -0.8, 0);
  pivot.add(tassel);

  const N = 70;
  const palette = ['#22d3ee', '#a78bfa', '#f472b6', '#fbbf24', '#34d399'].map(C);
  const confetti = glowPoints(N, Array.from({ length: N }, (_, i) => palette[i % palette.length]), Array.from({ length: N }, () => rnd(4, 8)));
  const seeds = Array.from({ length: N }, () => ({ o: Math.random(), a: Math.random() * 6.28, r: rnd(0.4, 1.8), s: rnd(0.25, 0.5) }));
  group.add(confetti);
  return {
    group,
    update(t) {
      board.rotation.y = Math.PI / 4 + Math.sin(t * 0.5) * 0.25;
      pivot.rotation.y = board.rotation.y - Math.PI / 4;
      pivot.rotation.z = Math.sin(t * 2.2) * 0.15;
      seeds.forEach((s, i) => {
        const k = (t * s.s + s.o) % 1;
        const a = s.a + t * 0.6;
        setPos(confetti, i, Math.cos(a) * s.r, 2.4 - k * 3.2, Math.sin(a) * s.r);
      });
      dirty(confetti, 'position');
    },
  };
}

/* ---------- sentiment: tweets clustering by polarity ---------- */
function sentiment() {
  const group = new THREE.Group();
  const N = 160;
  const classes = [
    { c: C('#34d399'), at: new THREE.Vector3(-1.2, 0.7, 0) },
    { c: C('#94a3b8'), at: new THREE.Vector3(1.2, 0.7, 0) },
    { c: C('#f87171'), at: new THREE.Vector3(0, -0.9, 0) },
  ];
  const neutral = C('#cbd5ff');
  const items = Array.from({ length: N }, (_, i) => {
    const cls = i % 10 < 3 ? 0 : i % 10 < 5 ? 1 : 2;
    return {
      cls,
      from: new THREE.Vector3().randomDirection().multiplyScalar(Math.cbrt(Math.random()) * 1.6),
      to: classes[cls].at.clone().add(new THREE.Vector3().randomDirection().multiplyScalar(Math.cbrt(Math.random()) * 0.42)),
      ph: Math.random() * 6.28,
    };
  });
  const pts = glowPoints(N, neutral, Array.from({ length: N }, () => rnd(4, 7)));
  group.add(pts);
  const rings = classes.map((k) => {
    const r = ringLoop(0.62, '#' + k.c.getHexString(), 0);
    r.position.copy(k.at);
    group.add(r);
    return r;
  });
  const col = new THREE.Color();
  const tmp = new THREE.Vector3();
  return {
    group,
    update(t) {
      const k = (t % 8) / 8;
      const m = k < 0.12 ? 0 : k < 0.45 ? ease((k - 0.12) / 0.33) : k < 0.85 ? 1 : 1 - ease((k - 0.85) / 0.15);
      items.forEach((it, i) => {
        tmp.lerpVectors(it.from, it.to, m);
        setPos(pts, i, tmp.x + Math.sin(t * 1.5 + it.ph) * 0.04, tmp.y + Math.cos(t * 1.3 + it.ph) * 0.04, tmp.z);
        setColor(pts, i, col.copy(neutral).lerp(classes[it.cls].c, m));
      });
      dirty(pts, 'position', 'aColor');
      rings.forEach((r, i) => { r.material.opacity = m * 0.8; r.rotation.z = t * (i + 1) * 0.3; });
      group.rotation.y = Math.sin(t * 0.4) * 0.4;
    },
  };
}

/* ---------- age & gender: face scan ---------- */
function face(color) {
  const group = new THREE.Group();
  const head = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1, 2)),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.28 }),
  );
  head.scale.set(0.82, 1.08, 0.9);
  group.add(head);
  const marks = [[-0.3, 0.22, 0.8], [0.3, 0.22, 0.8], [-0.42, 0.42, 0.72], [0.42, 0.42, 0.72], [0, -0.04, 0.92],
    [-0.24, -0.4, 0.74], [0, -0.45, 0.78], [0.24, -0.4, 0.74], [-0.66, -0.1, 0.5], [0.66, -0.1, 0.5]];
  const lm = glowPoints(marks.length, C('#ffffff'), 0);
  marks.forEach((p, i) => setPos(lm, i, ...p));
  dirty(lm, 'position');
  group.add(lm);
  const scan = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 6, 80), basic(color, 0.9));
  scan.rotation.x = Math.PI / 2;
  group.add(scan);
  // detection bracket
  const fw = 1.15, fh = 1.4, L = 0.35;
  const br = [];
  [[-1, 1], [1, 1], [1, -1], [-1, -1]].forEach(([sx, sy]) => {
    br.push(new THREE.Vector3(sx * fw, sy * fh, 0), new THREE.Vector3(sx * fw - sx * L, sy * fh, 0));
    br.push(new THREE.Vector3(sx * fw, sy * fh, 0), new THREE.Vector3(sx * fw, sy * fh - sy * L, 0));
  });
  const bracket = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(br), new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 }));
  bracket.position.z = 0.6;
  group.add(bracket);
  // prediction bars: age distribution + gender
  const bars = Array.from({ length: 6 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1, 0.14), std(i === 2 ? color : '#475569'));
    m.position.set(1.45 + i * 0.2, -1.05, 0);
    group.add(m);
    return m;
  });
  const targets = [[0.2, 0.5, 1.2, 0.6, 0.3, 0.1], [0.1, 0.3, 0.6, 1.2, 0.5, 0.2], [0.6, 1.2, 0.5, 0.2, 0.1, 0.05]];
  return {
    group,
    update(t) {
      const cyc = (t % 9) / 3, face = Math.floor(cyc) % 3, k = cyc % 1;
      const y = Math.sin(k * Math.PI * 2) * 1.0;
      scan.position.y = y;
      const s = Math.sqrt(Math.max(0.05, 1 - (y / 1.08) ** 2));
      scan.scale.set(s * 0.82, s * 0.9, 1);
      marks.forEach((p, i) => setSize(lm, i, k > 0.15 + i * 0.03 ? 6 : 0));
      dirty(lm, 'aSize');
      bars.forEach((b, i) => {
        const h = 0.05 + targets[face][i] * ease(clamp01((k - 0.4) / 0.4));
        b.scale.y = h; b.position.y = -1.05 + h / 2;
        b.material.color.set(targets[face][i] >= 1.2 ? color : '#475569');
        b.material.emissive.copy(b.material.color);
      });
      bracket.material.opacity = 0.4 + 0.5 * Math.abs(Math.sin(t * 3));
      group.rotation.y = Math.sin(t * 0.5) * 0.45;
    },
  };
}

/* ---------- VISIONARY: surveillance camera over a street ---------- */
function camera(color) {
  const group = new THREE.Group();
  const grid = new THREE.GridHelper(4.2, 12, 0x334155, 0x1e293b);
  grid.position.y = -1.2;
  group.add(grid);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.2), basic('#0f172a', 0.9));
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, -1.19, 0.6);
  group.add(road);

  const rig = new THREE.Group();
  rig.position.set(0, 1.25, -1.1);
  group.add(rig);
  const bodyGeo = new THREE.BoxGeometry(0.42, 0.42, 0.95);
  const body = new THREE.Mesh(bodyGeo, std('#334155', { emissive: C(color), emissiveIntensity: 0.1 }));
  body.add(edges(bodyGeo, color, 0.6));
  rig.add(body);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.19, 0.2, 24), std('#0b1020', { emissive: C(color), emissiveIntensity: 0.6 }));
  lens.rotation.x = Math.PI / 2;
  lens.position.z = 0.55;
  rig.add(lens);
  const rec = glowPoints(1, C('#f87171'), 10);
  setPos(rec, 0, 0.13, 0.25, 0.3); dirty(rec, 'position');
  rig.add(rec);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.6, 40, 1, true), basic(color, 0.1, { side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  cone.rotation.x = -Math.PI / 2;
  cone.position.z = 0.6 + 1.3;
  rig.add(cone);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8), std('#475569'));
  mast.position.set(0, 0.05, -1.1);
  group.add(mast);

  // incidents, each with a class-coloured bounding box
  const incidents = [];
  const addIncident = (mesh, boxSize, boxColor, move) => {
    const g = new THREE.Group();
    g.add(mesh);
    const box = edges(new THREE.BoxGeometry(...boxSize), boxColor, 0.9);
    box.position.y = boxSize[1] / 2 - 0.05;
    g.add(box);
    group.add(g);
    incidents.push({ g, box, move, ph: Math.random() * 6 });
  };
  const car = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.28), std('#38bdf8'));
  car.position.y = 0.11;
  addIncident(car, [0.62, 0.36, 0.4], '#f87171', (g, t) => g.position.set(1.8 - ((t * 0.5) % 1) * 3.6, -1.2, 0.85)); // wrong-way
  const car2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.28), std('#64748b'));
  car2.position.y = 0.11;
  addIncident(car2, [0.62, 0.36, 0.4], '#22d3ee', (g, t) => g.position.set(-1.8 + ((t * 0.35 + 0.5) % 1) * 3.6, -1.2, 0.35));
  const fire = glowPoints(20, Array.from({ length: 20 }, (_, i) => C(i % 3 ? '#fb923c' : '#fde047')), Array.from({ length: 20 }, () => rnd(5, 10)));
  addIncident(fire, [0.5, 0.75, 0.5], '#fb923c', (g, t) => {
    g.position.set(-1.3, -1.2, -0.7);
    for (let i = 0; i < 20; i++) {
      const k = (t * 0.9 + i / 20) % 1;
      setPos(fire, i, Math.sin(i * 7.1 + t * 3) * 0.12 * (1 - k), k * 0.7, Math.cos(i * 3.3) * 0.12 * (1 - k));
    }
    dirty(fire, 'position');
  });
  const pothole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 24), basic('#000000', 0.9));
  addIncident(pothole, [0.55, 0.12, 0.55], '#fbbf24', (g) => g.position.set(0.9, -1.19, 0.25));
  const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.3, 12), std('#22c55e'));
  bin.position.y = 0.15;
  addIncident(bin, [0.35, 0.42, 0.35], '#34d399', (g) => g.position.set(1.4, -1.2, -0.6));

  const alert = ringLoop(0.3, '#f87171', 0.8);
  alert.rotation.x = -Math.PI / 2;
  group.add(alert);
  return {
    group,
    update(t) {
      rig.rotation.y = Math.sin(t * 0.6) * 0.55;
      rig.rotation.x = 0.55;
      rec.material.uniforms.uOpacity.value = Math.sin(t * 6) > 0 ? 1 : 0.2;
      incidents.forEach((it, i) => {
        it.move(it.g, t);
        it.box.material.opacity = 0.45 + 0.45 * Math.abs(Math.sin(t * 2.5 + it.ph));
      });
      const k = (t * 0.7) % 1;
      alert.position.copy(incidents[0].g.position).add(new THREE.Vector3(0, 0.02, 0));
      alert.scale.setScalar(1 + k * 2.5);
      alert.material.opacity = 1 - k;
    },
  };
}

/* ---------- weapon detection: radar sweep locking onto a threat ---------- */
function radar(color) {
  const group = new THREE.Group();
  const disc = new THREE.Group();
  disc.rotation.x = -1.0;
  group.add(disc);
  disc.add(new THREE.Mesh(new THREE.CircleGeometry(1.7, 64), basic('#0b1220', 0.75)));
  [0.57, 1.13, 1.7].forEach((r) => disc.add(ringLoop(r, color, 0.45)));
  disc.add(lineOf([new THREE.Vector3(-1.7, 0, 0.01), new THREE.Vector3(1.7, 0, 0.01)], color, 0.2));
  disc.add(lineOf([new THREE.Vector3(0, -1.7, 0.01), new THREE.Vector3(0, 1.7, 0.01)], color, 0.2));
  const sweep = new THREE.Mesh(new THREE.CircleGeometry(1.7, 32, 0, 0.7), basic(color, 0.35, { blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  sweep.position.z = 0.01;
  disc.add(sweep);

  const blips = [[0.9, 0.6], [1.4, 2.0], [0.5, 2.9], [1.2, 3.9], [0.8, 4.8], [1.5, 5.6]];
  const bp = glowPoints(blips.length, blips.map((_, i) => C(i === 0 ? '#f87171' : '#e2e8f0')), 0);
  blips.forEach(([r, a], i) => setPos(bp, i, Math.cos(a) * r, Math.sin(a) * r, 0.03));
  dirty(bp, 'position');
  disc.add(bp);
  const lock = new THREE.Group();
  lock.position.set(Math.cos(0.6) * 0.9, Math.sin(0.6) * 0.9, 0.04);
  disc.add(lock);
  const lockBox = edges(new THREE.PlaneGeometry(0.45, 0.45), '#f87171', 1);
  lock.add(lockBox);
  const lockRing = ringLoop(0.25, '#f87171', 1);
  lock.add(lockRing);
  const beacon = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 4), std('#f87171'));
  beacon.position.set(0, 1.55, 0);
  group.add(beacon);
  return {
    group,
    update(t) {
      const ang = (t * 1.6) % (Math.PI * 2);
      sweep.rotation.z = ang - 0.7;
      let locked = 0;
      blips.forEach(([, a], i) => {
        let d = (ang - a) % (Math.PI * 2); if (d < 0) d += Math.PI * 2;
        const v = Math.exp(-d * 1.4);
        setSize(bp, i, 4 + v * (i === 0 ? 22 : 12));
        if (i === 0) locked = Math.max(0, 1 - d / 3.5);
      });
      dirty(bp, 'aSize');
      lock.scale.setScalar(1 + (1 - locked) * 0.6);
      lockBox.material.opacity = locked;
      lockRing.material.opacity = locked * (0.5 + 0.5 * Math.sin(t * 12));
      lock.rotation.z = t * 1.5;
      beacon.material.emissiveIntensity = 0.3 + locked * 1.5;
      beacon.rotation.y = t * 3;
      beacon.position.y = 1.55 + Math.sin(t * 4) * 0.05 * locked;
    },
  };
}

/* ---------- ZeroBS: LSTM anomaly detection + Flask dashboard ---------- */
function signal(color) {
  const group = new THREE.Group();
  const panelGeo = new THREE.PlaneGeometry(3.6, 1.6);
  const panel = new THREE.Mesh(panelGeo, basic('#0f172a', 0.85, { side: THREE.DoubleSide }));
  panel.position.set(0, -1.15, -0.7);
  panel.add(edges(panelGeo, color, 0.5));
  group.add(panel);
  const bars = Array.from({ length: 8 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1, 0.08), std(i % 3 === 0 ? color : '#38bdf8'));
    m.position.set(-1.4 + i * 0.4, -1.8, -0.62);
    group.add(m);
    return m;
  });
  const M = 120, X0 = -2, X1 = 2;
  const mk = (c, o) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(M * 3), 3));
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o }));
    group.add(l);
    return l;
  };
  const sig = mk('#22d3ee', 1), up = mk(color, 0.35), dn = mk(color, 0.35);
  const spike = glowPoints(1, C('#f87171'), 26);
  group.add(spike);
  const ring = ringLoop(0.18, '#f87171', 1);
  group.add(ring);
  const base = (x, t) => 0.35 * Math.sin(x * 2.6 + t * 1.8) + 0.18 * Math.sin(x * 6.3 - t * 2.4) + 0.4;
  return {
    group,
    update(t) {
      const ax = X1 - ((t * 0.45) % 1) * (X1 - X0);
      const s = sig.geometry.attributes.position.array, u = up.geometry.attributes.position.array, d = dn.geometry.attributes.position.array;
      for (let i = 0; i < M; i++) {
        const x = X0 + (i / (M - 1)) * (X1 - X0), b = base(x, t);
        const z = Math.sin(x * 1.2) * 0.3;
        s[i * 3] = x; s[i * 3 + 1] = b + 0.85 * Math.exp(-(((x - ax) * 7) ** 2)) + Math.sin(i * 12.9 + t * 9) * 0.02; s[i * 3 + 2] = z;
        u[i * 3] = x; u[i * 3 + 1] = b + 0.3; u[i * 3 + 2] = z;
        d[i * 3] = x; d[i * 3 + 1] = b - 0.3; d[i * 3 + 2] = z;
      }
      [sig, up, dn].forEach((l) => { l.geometry.attributes.position.needsUpdate = true; });
      const ay = base(ax, t) + 0.85, az = Math.sin(ax * 1.2) * 0.3;
      setPos(spike, 0, ax, ay, az); dirty(spike, 'position');
      ring.position.set(ax, ay, az);
      ring.scale.setScalar(1 + ((t * 2) % 1) * 1.5);
      ring.material.opacity = 1 - ((t * 2) % 1);
      bars.forEach((b, i) => {
        const h = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.2 + i * 0.9));
        b.scale.y = h; b.position.y = -1.88 + h / 2;
      });
    },
  };
}

/* ---------- RAG: documents -> vector lattice -> retrieved context -> answer ---------- */
function rag(color) {
  const group = new THREE.Group();
  const G = 4, S = 0.42, lattice = [];
  for (let x = 0; x < G; x++) for (let y = 0; y < G; y++) for (let z = 0; z < G; z++) {
    lattice.push(new THREE.Vector3((x - 1.5) * S, (y - 1.5) * S - 0.3, (z - 1.5) * S));
  }
  const lp = glowPoints(lattice.length, C(color), 5, 0.9);
  lattice.forEach((v, i) => setPos(lp, i, v.x, v.y, v.z));
  dirty(lp, 'position');
  group.add(lp);
  group.add(edges(new THREE.BoxGeometry(G * S, G * S, G * S).translate(0, -0.3, 0), color, 0.15));

  const docColors = ['#f87171', '#38bdf8', '#fbbf24'];
  const docs = docColors.map((c) => {
    const geo = new THREE.PlaneGeometry(0.5, 0.66);
    const m = new THREE.Mesh(geo, basic('#0f172a', 0.9, { side: THREE.DoubleSide }));
    m.add(edges(geo, c, 1));
    for (let k = 0; k < 4; k++) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.32 - (k % 2) * 0.1, 0.035), basic(c, 0.8, { side: THREE.DoubleSide }));
      line.position.set(-0.03, 0.18 - k * 0.12, 0.01);
      m.add(line);
    }
    group.add(m);
    return m;
  });
  const CH = 24;
  const chunks = glowPoints(CH, Array.from({ length: CH }, (_, i) => C(docColors[i % 3])), 7);
  const chunkTargets = Array.from({ length: CH }, () => (Math.random() * lattice.length) | 0);
  group.add(chunks);

  const answer = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), std('#ffffff', { emissive: C(color), emissiveIntensity: 0.8 }));
  answer.position.set(0, 1.45, 0);
  group.add(answer);
  const K = 5;
  const beams = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7 }));
  beams.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(K * 6), 3));
  group.add(beams);
  let picked = [], lastPick = -1;
  const tmp = new THREE.Vector3(), docPos = new THREE.Vector3();
  return {
    group,
    update(t) {
      docs.forEach((d, i) => {
        const a = t * 0.35 + (i / 3) * Math.PI * 2;
        d.position.set(Math.cos(a) * 2, 0.2 + Math.sin(t + i) * 0.15, Math.sin(a) * 2);
        d.lookAt(0, 0.2, 0);
      });
      for (let i = 0; i < CH; i++) {
        const k = (t * 0.5 + i / CH) % 1;
        const d = docs[i % 3];
        docPos.copy(d.position);
        tmp.lerpVectors(docPos, lattice[chunkTargets[i]], ease(k));
        setPos(chunks, i, tmp.x, tmp.y, tmp.z);
        if (k < 0.02) chunkTargets[i] = (Math.random() * lattice.length) | 0;
      }
      dirty(chunks, 'position');
      const cyc = Math.floor(t / 2.5);
      if (cyc !== lastPick) {
        lastPick = cyc;
        picked = Array.from({ length: K }, () => (Math.random() * lattice.length) | 0);
      }
      const k = (t % 2.5) / 2.5;
      for (let i = 0; i < lattice.length; i++) setSize(lp, i, 5);
      const b = beams.geometry.attributes.position.array;
      picked.forEach((idx, j) => {
        setSize(lp, idx, 16);
        const v = lattice[idx];
        const e = clamp01((k - 0.2) / 0.4);
        b.set([v.x, v.y, v.z, v.x + (answer.position.x - v.x) * e, v.y + (answer.position.y - v.y) * e, v.z + (answer.position.z - v.z) * e], j * 6);
      });
      dirty(lp, 'aSize');
      beams.geometry.attributes.position.needsUpdate = true;
      beams.material.opacity = 0.7 * (1 - clamp01((k - 0.8) / 0.2));
      answer.rotation.y = t * 2;
      answer.scale.setScalar(1 + clamp01((k - 0.55) / 0.2) * 0.4 * (1 - clamp01((k - 0.85) / 0.15)));
    },
  };
}

/* ---------- ATS: resumes re-ranked against a job description ---------- */
function ats(color) {
  const group = new THREE.Group();
  const jdGeo = new THREE.PlaneGeometry(0.8, 1);
  const jd = new THREE.Mesh(jdGeo, basic('#0f172a', 0.9, { side: THREE.DoubleSide }));
  jd.add(edges(jdGeo, '#fbbf24', 1));
  jd.position.set(0, 1.5, -0.9);
  group.add(jd);
  const jdGlow = glowPoints(1, C('#fbbf24'), 60, 0.6);
  jd.add(jdGlow);

  const N = 6;
  const cards = Array.from({ length: N }, () => {
    const g = new THREE.Group();
    const geo = new THREE.PlaneGeometry(0.5, 0.66);
    const face = new THREE.Mesh(geo, basic('#111827', 0.95, { side: THREE.DoubleSide }));
    const outline = edges(geo, '#64748b', 1);
    face.add(outline);
    for (let k = 0; k < 4; k++) {
      const l = new THREE.Mesh(new THREE.PlaneGeometry(0.3 - (k % 2) * 0.1, 0.03), basic('#64748b', 0.9, { side: THREE.DoubleSide }));
      l.position.set(-0.03, 0.18 - k * 0.11, 0.01);
      face.add(l);
    }
    g.add(face);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.3), std('#475569'));
    g.add(bar);
    group.add(g);
    return { g, face, outline, bar, score: Math.random(), x: 0, y: 0, h: 0.1 };
  });
  const beams = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: '#fbbf24', transparent: true, opacity: 0.4 }));
  beams.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 6), 3));
  group.add(beams);
  let last = -1;
  return {
    group,
    update(t, dt) {
      const cyc = Math.floor(t / 3.2);
      if (cyc !== last) { last = cyc; cards.forEach((c) => { c.score = 0.25 + Math.random() * 0.75; }); }
      const order = [...cards].sort((a, b) => b.score - a.score);
      const k = Math.min(1, dt * 4);
      order.forEach((c, rank) => {
        const tx = -1.6 + rank * 0.64, th = c.score * 1.3;
        c.x += (tx - c.x) * k; c.h += (th - c.h) * k;
        c.bar.scale.y = c.h; c.bar.position.y = -1.2 + c.h / 2;
        c.face.position.y = -1.2 + c.h + 0.45;
        c.g.position.x = c.x;
        const top = rank < 3;
        c.outline.material.color.set(rank === 0 ? color : top ? '#a7f3d0' : '#64748b');
        c.bar.material.color.set(top ? color : '#475569');
        c.bar.material.emissive.copy(c.bar.material.color);
        c.bar.material.emissiveIntensity = rank === 0 ? 0.8 : 0.3;
      });
      const b = beams.geometry.attributes.position.array;
      order.slice(0, 3).forEach((c, i) => b.set([0, 1.0, -0.9, c.x, c.face.position.y + 0.33, 0], i * 6));
      beams.geometry.attributes.position.needsUpdate = true;
      beams.material.opacity = 0.25 + 0.25 * Math.sin(t * 3);
      jd.rotation.y = Math.sin(t * 0.8) * 0.2;
    },
  };
}

/* ---------- StaffViz: agent core dispatching to tools ---------- */
function agent(color) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), std(color, { emissiveIntensity: 0.6, flatShading: true }));
  group.add(core);
  const shell = edges(new THREE.IcosahedronGeometry(0.72, 1), color, 0.35);
  group.add(shell);
  const user = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), std('#e2e8f0'));
  user.position.set(-1.9, 0.9, 0);
  group.add(user);
  const toolDefs = [
    { mesh: new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.06), std('#38bdf8')), pos: new THREE.Vector3(1.8, 0.95, 0.2) },
    { mesh: new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.34, 20), std('#fbbf24')), pos: new THREE.Vector3(2.0, -0.25, -0.3) },
    { mesh: new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.06, 10, 24), std('#f472b6')), pos: new THREE.Vector3(1.3, -1.25, 0.3) },
  ];
  const links = [];
  const link = (a, b) => {
    const l = lineOf([a, b], color, 0.2);
    group.add(l);
    links.push(l);
    return l;
  };
  const userLink = link(user.position, new THREE.Vector3());
  toolDefs.forEach((d) => { d.mesh.position.copy(d.pos); group.add(d.mesh); d.link = link(new THREE.Vector3(), d.pos); });
  const packet = glowPoints(1, C('#ffffff'), 22);
  group.add(packet);
  const tmp = new THREE.Vector3(), O = new THREE.Vector3();
  return {
    group,
    update(t) {
      core.rotation.y = t * 0.8; core.rotation.x = t * 0.4;
      shell.rotation.y = -t * 0.3;
      toolDefs.forEach((d, i) => { d.mesh.rotation.y = t * (1 + i * 0.3); d.mesh.rotation.x = t * 0.5; });
      const step = 0.7, cyc = Math.floor(t / (step * 4)), s = Math.floor(t / step) % 4, f = (t % step) / step;
      const tool = toolDefs[cyc % 3];
      const legs = [[user.position, O, userLink], [O, tool.pos, tool.link], [tool.pos, O, tool.link], [O, user.position, userLink]];
      const [a, b, l] = legs[s];
      tmp.lerpVectors(a, b, ease(f));
      setPos(packet, 0, tmp.x, tmp.y, tmp.z); dirty(packet, 'position');
      links.forEach((x) => { x.material.opacity = x === l ? 0.9 : 0.2; });
      core.scale.setScalar(1 + (s === 1 || s === 3 ? Math.sin(f * Math.PI) * 0.15 : 0));
      tool.mesh.scale.setScalar(1 + (s === 2 ? Math.sin(f * Math.PI) * 0.4 : 0));
    },
  };
}

/* ---------- today: location beacon ---------- */
function beacon(color) {
  const group = new THREE.Group();
  const pin = new THREE.Group();
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 32), std(color, { emissiveIntensity: 0.5 }));
  head.position.y = 0.55;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.9, 32), std(color, { emissiveIntensity: 0.5 }));
  tip.rotation.x = Math.PI;
  tip.position.y = 0.05;
  const hole = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 20), std('#05060f'));
  hole.position.set(0, 0.58, 0.32);
  pin.add(head, tip, hole);
  group.add(pin);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.5, 5, 32, 1, true), basic(color, 0.12, { blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  beam.position.y = 2.6;
  group.add(beam);
  const rings = [0, 1, 2].map(() => {
    const r = ringLoop(0.5, color, 0.8);
    r.rotation.x = -Math.PI / 2;
    r.position.y = -0.5;
    group.add(r);
    return r;
  });
  return {
    group,
    update(t) {
      pin.position.y = Math.sin(t * 1.5) * 0.12;
      pin.rotation.y = t * 0.8;
      rings.forEach((r, i) => {
        const k = (t * 0.5 + i / 3) % 1;
        r.scale.setScalar(1 + k * 3);
        r.material.opacity = 0.8 * (1 - k);
      });
    },
  };
}

const builders = { books, cap, sentiment, face, camera, radar, signal, rag, ats, agent, beacon };

export function buildEmblem(type, color) {
  return (builders[type] || books)(color);
}
