import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { makeRenderer, makeLabelRenderer, onResize, glowPoints, trackPointer, showTooltip, hideTooltip } from './three-utils.js';

const START_YEAR = 2023, MONTHS = 36; // Jan 2023 .. Dec 2025
const X0 = -6.5, X1 = 6.5, H = 5;
const BACK_Z = -4.4, FRONT_Z = 4.4;
const LANE_Z = { ml: 3, cv: 0, llm: -3 };

const monthIndex = (ym) => { const [y, m] = ym.split('-').map(Number); return (y - START_YEAR) * 12 + (m - 1); };
const mapX = (m) => X0 + (m / MONTHS) * (X1 - X0);
const mapY = (v) => (v / 100) * H;

function label(cls, html, color) {
  const el = document.createElement('div');
  el.className = cls;
  el.innerHTML = html;
  if (color) el.style.setProperty('--c', color);
  return { obj: new CSS2DObject(el), el };
}

function line(points, color, opacity) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
}

// 3D scatter of projects: x = delivery date, y = headline result, z = domain lane. Floor bars = duration.
export function createSpace(container, projects, lanes, { tooltip, reduced, onSelect }) {
  const renderer = makeRenderer(container);
  const labels = makeLabelRenderer(container);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  camera.position.set(5, 6.5, 15);

  const controls = new OrbitControls(camera, labels.domElement);
  controls.target.set(0, 1.8, 0);
  controls.enableDamping = true;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = 1.48;
  if (matchMedia('(pointer: coarse)').matches) {
    controls.touches = { ONE: null, TWO: THREE.TOUCH.DOLLY_ROTATE };
    labels.domElement.style.touchAction = 'pan-y';
  }

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(5, 10, 7);
  scene.add(key);
  const rim = new THREE.PointLight(0x22d3ee, 40, 0, 1.6);
  rim.position.set(-7, 6, -6);
  scene.add(rim);

  // floor grid + lanes
  const grid = new THREE.GridHelper(16, 32, 0x2a3358, 0x161b33);
  grid.material.transparent = true;
  grid.material.opacity = 0.7;
  scene.add(grid);

  lanes.forEach((l) => {
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(X1 - X0 + 0.6, 1.7),
      new THREE.MeshBasicMaterial({ color: l.color, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false }),
    );
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(0, 0.005, LANE_Z[l.id]);
    scene.add(strip);
    scene.add(line([new THREE.Vector3(X0 - 0.3, 0.01, LANE_Z[l.id]), new THREE.Vector3(X1 + 0.3, 0.01, LANE_Z[l.id])], l.color, 0.25));
    const lab = label('s-lane', l.label, l.color);
    lab.obj.position.set(X0 - 1.6, 0.05, LANE_Z[l.id]);
    scene.add(lab.obj);
  });

  // axes
  scene.add(line([new THREE.Vector3(X0, 0, FRONT_Z), new THREE.Vector3(X1, 0, FRONT_Z)], '#5d6488', 0.8));
  for (let y = 0; y <= 3; y++) {
    const x = mapX(y * 12);
    scene.add(line([new THREE.Vector3(x, 0, FRONT_Z), new THREE.Vector3(x, 0, FRONT_Z + 0.25)], '#5d6488', 0.8));
    scene.add(line([new THREE.Vector3(x, 0.01, FRONT_Z), new THREE.Vector3(x, 0.01, BACK_Z)], '#5d6488', 0.12));
    const lab = label('s-axis', String(START_YEAR + y));
    lab.obj.position.set(x, 0, FRONT_Z + 0.75);
    scene.add(lab.obj);
  }
  const yAxisX = X0 - 0.3;
  scene.add(line([new THREE.Vector3(yAxisX, 0, BACK_Z), new THREE.Vector3(yAxisX, H + 0.4, BACK_Z)], '#5d6488', 0.8));
  [0, 25, 50, 75, 100].forEach((v) => {
    const y = mapY(v);
    if (v > 0) scene.add(line([new THREE.Vector3(yAxisX, y, BACK_Z), new THREE.Vector3(X1, y, BACK_Z)], '#5d6488', 0.14));
    const lab = label('s-axis', `${v}%`);
    lab.obj.position.set(yAxisX - 0.5, y, BACK_Z);
    scene.add(lab.obj);
  });
  const yTitle = label('s-axis', 'headline result ↑');
  yTitle.obj.position.set(yAxisX, H + 0.8, BACK_Z);
  scene.add(yTitle.obj);

  // project markers
  const laneById = Object.fromEntries(lanes.map((l) => [l.id, l]));
  const records = projects.map((p, i) => {
    const color = new THREE.Color(laneById[p.lane].color);
    const m0 = monthIndex(p.start), m1 = monthIndex(p.end) + 1;
    const x = mapX(m1), z = LANE_Z[p.lane];
    const y = p.metric ? mapY(p.metric.value) : 0.5;
    const isWork = p.kind === 'work';

    const mat = p.metric
      ? new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, roughness: 0.25, metalness: 0.3, transparent: true })
      : new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true });
    const sphere = new THREE.Mesh(isWork ? new THREE.OctahedronGeometry(0.3) : new THREE.SphereGeometry(0.24, 32, 32), mat);
    sphere.position.set(x, y, z);
    sphere.userData.id = p.id;
    scene.add(sphere);

    const glow = glowPoints(1, color, 70, 0.55);
    sphere.add(glow);

    const stem = line([new THREE.Vector3(x, 0, z), new THREE.Vector3(x, y, z)], color, 0.5);
    scene.add(stem);
    const back = line([new THREE.Vector3(x, y, z), new THREE.Vector3(yAxisX, y, z)], color, 0);
    scene.add(back);

    const xs = mapX(m0), len = Math.max(x - xs, 0.12);
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(len, 0.06, 0.34),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 }),
    );
    bar.position.set(xs + len / 2, 0.04, z);
    scene.add(bar);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.26, 0.32, 48),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.02, z);
    scene.add(ring);

    const lab = label('s-label', `<b>${p.title}</b><span>${p.metric ? p.metric.display : 'app'}</span>`, laneById[p.lane].color);
    lab.obj.position.set(0, 0.6, 0);
    sphere.add(lab.obj);

    return { p, sphere, mat, glow, stem, back, bar, ring, el: lab.el, baseY: y, phase: i * 0.7, scale: 1, dim: 1 };
  });

  // drifting particles inside the volume
  const D = 260;
  const motes = glowPoints(D, new THREE.Color('#6b7cff'), Array.from({ length: D }, () => 1 + Math.random() * 2), 0.5);
  const mp = motes.geometry.attributes.position.array;
  for (let i = 0; i < D; i++) {
    mp[i * 3] = X0 + Math.random() * (X1 - X0);
    mp[i * 3 + 1] = Math.random() * H;
    mp[i * 3 + 2] = BACK_Z + Math.random() * (FRONT_Z - BACK_Z);
  }
  scene.add(motes);

  // interaction
  const ray = new THREE.Raycaster();
  const pickables = records.map((r) => r.sphere);
  let hovered = null, selected = null, highlighted = null;

  const pointer = trackPointer(labels.domElement, {
    onClick(p) {
      ray.setFromCamera(p.ndc, camera);
      const hit = ray.intersectObjects(pickables, false)[0];
      if (hit) { select(hit.object.userData.id); onSelect?.(hit.object.userData.id); }
    },
  });

  function select(id) { selected = id; }
  function highlight(id) { highlighted = id; }

  onResize(container, (w, h) => {
    renderer.setSize(w, h, false);
    labels.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = w < 600 ? 62 : 42;
    camera.updateProjectionMatrix();
  });

  // gentle intro sweep the first time the chart is seen
  let introT = reduced ? 1 : 0;
  const introFrom = new THREE.Vector3(2, 14, 17);
  const introTo = camera.position.clone();

  function tick(t, dt) {
    if (introT < 1) {
      introT = Math.min(1, introT + dt * 0.45);
      const e = 1 - Math.pow(1 - introT, 3);
      camera.position.lerpVectors(introFrom, introTo, e);
    }
    controls.update();

    let hit = null;
    if (pointer.inside) {
      ray.setFromCamera(pointer.ndc, camera);
      hit = ray.intersectObjects(pickables, false)[0]?.object ?? null;
    }
    if (hit !== hovered) {
      hovered = hit;
      labels.domElement.style.cursor = hit ? 'pointer' : '';
      if (!hit) hideTooltip(tooltip);
    }
    const hoverId = hovered?.userData.id ?? highlighted;
    if (hovered) {
      const r = records.find((x) => x.p.id === hovered.userData.id);
      const color = laneById[r.p.lane].color;
      showTooltip(tooltip,
        `<b>${r.p.title}</b><span class="tt-sub"><span class="tt-dot" style="background:${color}"></span>${r.p.period}<br>${r.p.metric ? `${r.p.metric.display} ${r.p.metric.label}` : 'Interactive Streamlit app'}</span>`,
        pointer.clientX, pointer.clientY);
    }

    const focusId = hoverId ?? null;
    records.forEach((r) => {
      const active = r.p.id === focusId || r.p.id === selected;
      const dimTarget = focusId && r.p.id !== focusId && r.p.id !== selected ? 0.25 : 1;
      r.dim += (dimTarget - r.dim) * Math.min(1, dt * 6);
      const target = active ? 1.45 : 1;
      r.scale += (target - r.scale) * Math.min(1, dt * 8);
      r.sphere.scale.setScalar(r.scale);
      r.sphere.position.y = r.baseY + Math.sin(t * 1.4 + r.phase) * 0.06 * (reduced ? 0 : 1);
      r.sphere.rotation.y += dt * 0.6;
      r.mat.opacity = r.dim;
      r.glow.material.uniforms.uOpacity.value = (active ? 1 : 0.5) * r.dim;
      r.stem.material.opacity = 0.5 * r.dim;
      r.back.material.opacity = active ? 0.45 : 0;
      r.bar.material.opacity = 0.6 * r.dim;
      r.el.style.opacity = Math.max(r.dim, 0.2);

      const k = ((t * 0.5 + r.phase) % 1);
      r.ring.scale.setScalar(1 + k * (active ? 2.2 : 1.4));
      r.ring.material.opacity = (1 - k) * 0.6 * r.dim;
    });

    motes.position.y = Math.sin(t * 0.3) * 0.1;
    renderer.render(scene, camera);
    labels.render(scene, camera);
  }

  return { tick, select, highlight };
}
