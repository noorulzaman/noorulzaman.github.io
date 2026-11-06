import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { makeRenderer, makeLabelRenderer, onResize, glowPoints, fibonacciSphere, trackPointer, showTooltip, hideTooltip } from './three-utils.js';

const HOME_CAM = new THREE.Vector3(0, 7, 19);
const HOME_TARGET = new THREE.Vector3(0, 0, 0);

// Skill clusters orbiting on a ring; each skill is a node spinning around its discipline's core.
export function createGalaxy(container, groups, { tooltip, reduced, onFocus }) {
  const renderer = makeRenderer(container);
  const labels = makeLabelRenderer(container);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  camera.position.copy(HOME_CAM);

  const controls = new OrbitControls(camera, labels.domElement);
  controls.enableDamping = true;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = 2.3;
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 0.6;
  if (matchMedia('(pointer: coarse)').matches) {
    // keep one-finger vertical swipes for page scrolling; two fingers orbit
    controls.touches = { ONE: null, TWO: THREE.TOUCH.DOLLY_ROTATE };
    labels.domElement.style.touchAction = 'pan-y';
  }

  const ringR = 7.2;
  const clusters = groups.map((g, gi) => {
    const a = (gi / groups.length) * Math.PI * 2;
    const center = new THREE.Vector3(Math.cos(a) * ringR, Math.sin(gi * 1.9) * 1.6, Math.sin(a) * ringR);
    const color = new THREE.Color(g.color);

    const holder = new THREE.Group();
    holder.position.copy(center);
    scene.add(holder);

    const spin = new THREE.Group();
    spin.rotation.set(Math.random() * Math.PI, 0, Math.random() * Math.PI);
    holder.add(spin);

    const coreMat = new THREE.MeshBasicMaterial({ color, transparent: true });
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 32), coreMat);
    core.userData = { type: 'cluster', gi };
    holder.add(core);
    const glow = glowPoints(1, color, 90, 0.7);
    holder.add(glow);
    const shellMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 });
    const shell = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.75, 0)), shellMat);
    holder.add(shell);

    const catEl = document.createElement('div');
    catEl.className = 'g-label g-cat';
    catEl.style.setProperty('--c', g.color);
    catEl.textContent = g.name;
    const catLabel = new CSS2DObject(catEl);
    catLabel.position.set(0, 1.0, 0);
    holder.add(catLabel);

    const radius = 1.5 + g.items.length * 0.075;
    const dirs = fibonacciSphere(g.items.length);
    const linePos = [];
    const light = color.clone().lerp(new THREE.Color('#ffffff'), 0.35);
    const nodes = g.items.map((name, si) => {
      const mat = new THREE.MeshBasicMaterial({ color: light, transparent: true });
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), mat);
      m.position.copy(dirs[si]).multiplyScalar(radius * (0.85 + (si % 3) * 0.1));
      m.userData = { type: 'skill', gi, name };
      linePos.push(0, 0, 0, m.position.x, m.position.y, m.position.z);
      const el = document.createElement('div');
      el.className = 'g-label';
      el.textContent = name;
      const lab = new CSS2DObject(el);
      lab.position.set(0, 0.28, 0);
      m.add(lab);
      spin.add(m);
      return { mesh: m, el, scale: 1 };
    });

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false });
    spin.add(new THREE.LineSegments(lineGeo, lineMat));

    return {
      g, gi, center, holder, spin, core, coreMat, glow, shell, shellMat, catEl, nodes, lineMat,
      axis: new THREE.Vector3(Math.random() - 0.5, 1, Math.random() - 0.5).normalize(),
      speed: 0.12 + Math.random() * 0.12, dim: 1,
    };
  });

  // faint ring connecting the clusters
  const ringPts = [];
  for (let i = 0; i <= 200; i++) {
    const a = (i / 200) * Math.PI * 2;
    ringPts.push(new THREE.Vector3(Math.cos(a) * ringR, 0, Math.sin(a) * ringR));
  }
  const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts),
    new THREE.LineBasicMaterial({ color: '#5d6488', transparent: true, opacity: 0.25 }));
  scene.add(ring);
  const centerLines = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(clusters.flatMap((c) => [new THREE.Vector3(), c.center])),
    new THREE.LineBasicMaterial({ color: '#5d6488', transparent: true, opacity: 0.12 }),
  );
  scene.add(centerLines);
  const heart = glowPoints(1, new THREE.Color('#a78bfa'), 120, 0.35);
  scene.add(heart);

  // dust
  const D = 900;
  const dust = glowPoints(D, new THREE.Color('#8fa4ff'), Array.from({ length: D }, () => 1 + Math.random() * 2.5), 0.5);
  const dp = dust.geometry.attributes.position.array;
  for (let i = 0; i < D; i++) {
    const r = 4 + Math.random() * 26, a = Math.random() * Math.PI * 2;
    dp[i * 3] = Math.cos(a) * r; dp[i * 3 + 1] = (Math.random() - 0.5) * 10 * (1 - r / 34); dp[i * 3 + 2] = Math.sin(a) * r;
  }
  scene.add(dust);

  // interaction
  const pickables = clusters.flatMap((c) => [c.core, ...c.nodes.map((n) => n.mesh)]);
  const ray = new THREE.Raycaster();
  let hovered = null;
  let focused = -1;
  let fly = null;
  let resumeTimer = 0;

  const pointer = trackPointer(labels.domElement, {
    onClick(p) {
      ray.setFromCamera(p.ndc, camera);
      const hit = ray.intersectObjects(pickables, false)[0];
      if (hit) focus(hit.object.userData.gi === focused && hit.object.userData.type === 'cluster' ? -1 : hit.object.userData.gi);
    },
  });

  controls.addEventListener('start', () => { fly = null; controls.autoRotate = false; clearTimeout(resumeTimer); });
  controls.addEventListener('end', () => {
    clearTimeout(resumeTimer);
    if (focused === -1 && !reduced) resumeTimer = setTimeout(() => { controls.autoRotate = true; }, 3500);
  });

  function focus(i) {
    focused = i;
    controls.autoRotate = i === -1 && !reduced;
    if (i === -1) {
      fly = { cam: HOME_CAM.clone(), target: HOME_TARGET.clone() };
    } else {
      const c = clusters[i].center;
      const out = new THREE.Vector3(c.x, 0, c.z).normalize();
      fly = { cam: c.clone().addScaledVector(out, 7.5).add(new THREE.Vector3(0, 2.4, 0)), target: c.clone() };
    }
    clusters.forEach((c) => { c.dim = i === -1 || c.gi === i ? 1 : 0.12; });
    onFocus?.(i);
  }

  onResize(container, (w, h) => {
    renderer.setSize(w, h, false);
    labels.setSize(w, h);
    camera.aspect = w / h;
    // pull back on narrow screens so the whole ring fits
    camera.fov = w < 600 ? 68 : 50;
    camera.updateProjectionMatrix();
  });

  const motion = reduced ? 0.2 : 1;
  function tick(t, dt) {
    if (fly) {
      const k = 1 - Math.pow(0.0015, dt);
      camera.position.lerp(fly.cam, k);
      controls.target.lerp(fly.target, k);
      if (camera.position.distanceTo(fly.cam) < 0.02) fly = null;
    }
    controls.update();

    // hover
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
    if (hovered) {
      const g = groups[hovered.userData.gi];
      const body = hovered.userData.type === 'cluster'
        ? `<b>${g.name}</b><span class="tt-sub">${g.items.length} skills · click to ${focused === hovered.userData.gi ? 'zoom out' : 'fly here'}</span>`
        : `<b>${hovered.userData.name}</b><span class="tt-sub"><span class="tt-dot" style="background:${g.color}"></span>${g.name}</span>`;
      showTooltip(tooltip, body, pointer.clientX, pointer.clientY);
    }

    clusters.forEach((c) => {
      c.spin.rotateOnAxis(c.axis, dt * c.speed * motion);
      c.shell.rotation.y += dt * 0.4 * motion;
      c.shell.rotation.x += dt * 0.25 * motion;
      const pulse = 1 + Math.sin(t * 2 + c.gi) * 0.06;
      c.core.scale.setScalar((hovered === c.core ? 1.25 : 1) * pulse);

      // ease opacity toward the focus state
      const cur = c.coreMat.opacity;
      const o = cur + (c.dim - cur) * Math.min(1, dt * 5);
      c.coreMat.opacity = o;
      c.shellMat.opacity = 0.35 * o;
      c.lineMat.opacity = 0.28 * o;
      c.glow.material.uniforms.uOpacity.value = 0.7 * o;
      c.catEl.style.opacity = Math.max(o, 0.25);

      c.nodes.forEach((n) => {
        const target = hovered === n.mesh ? 2.2 : 1;
        n.scale += (target - n.scale) * Math.min(1, dt * 10);
        n.mesh.scale.setScalar(n.scale);
        n.mesh.material.opacity = o;
        // overview shows cluster names only; skill names appear on hover or when a cluster is focused
        const labelOn = focused === -1 ? 0 : (c.gi === focused ? 1 : 0);
        n.el.style.opacity = hovered === n.mesh ? 1 : labelOn * Math.min(1, o * 1.2);
        n.el.classList.toggle('hot', hovered === n.mesh);
      });
    });

    dust.rotation.y = t * 0.01 * motion;
    renderer.render(scene, camera);
    labels.render(scene, camera);
  }

  return { tick, focus };
}
