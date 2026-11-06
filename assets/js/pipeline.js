import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { makeRenderer, makeLabelRenderer, onResize, glowPoints } from './three-utils.js';
import { buildEmblem } from './emblems.js';

const tubeVert = /* glsl */ `
  varying vec2 vUv;
  varying float vFade;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vFade = smoothstep(60.0, 14.0, -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;

const tubeFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uC;
  varying vec2 vUv;
  varying float vFade;
  void main() {
    float flow = fract(vUv.x * 60.0 - uTime * 0.9);
    float band = smoothstep(0.0, 0.08, flow) * smoothstep(0.4, 0.08, flow);
    vec3 col = vUv.x < 0.5 ? mix(uA, uB, vUv.x * 2.0) : mix(uB, uC, (vUv.x - 0.5) * 2.0);
    float edge = pow(abs(sin(vUv.y * 3.14159)), 0.6);
    gl_FragColor = vec4(col * (0.5 + band * 2.2), (0.35 + band * 0.65) * edge * vFade);
    #include <colorspace_fragment>
  }`;

// Scroll-driven ride along a glowing data pipeline. `state.s` (0..n-1) is the scroll position in stations.
export function createPipeline(container, stations, state, { reduced }) {
  const renderer = makeRenderer(container);
  const labels = makeLabelRenderer(container);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05060f, 14, 55);
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(4, 10, 6);
  scene.add(sun);
  const spot = new THREE.PointLight(0xffffff, 30, 12, 1.5);
  scene.add(spot);

  const n = stations.length;
  const anchors = stations.map((_, i) => new THREE.Vector3(Math.sin(i * 0.95) * 4.5, Math.cos(i * 0.7) * 1.4, -i * 10));
  // lead-in and lead-out so the tube runs past the first and last stations
  const pts = [anchors[0].clone().add(new THREE.Vector3(-3, 0, 10)), ...anchors, anchors[n - 1].clone().add(new THREE.Vector3(3, 0, -12))];
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
  const tAt = (i) => (i + 1) / (pts.length - 1); // curve param of station i

  const tubeMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uA: { value: new THREE.Color('#22d3ee') }, uB: { value: new THREE.Color('#a78bfa') }, uC: { value: new THREE.Color('#34d399') } },
    vertexShader: tubeVert, fragmentShader: tubeFrag,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 900, 0.14, 16, false), tubeMat));
  const sheath = new THREE.Mesh(new THREE.TubeGeometry(curve, 300, 0.42, 8, false),
    new THREE.MeshBasicMaterial({ color: '#5b6bff', wireframe: true, transparent: true, opacity: 0.05 }));
  scene.add(sheath);

  // data packets riding the tube
  const P = 160;
  const packetSeeds = Array.from({ length: P }, () => ({ u: Math.random(), s: 0.004 + Math.random() * 0.01, off: new THREE.Vector3().randomDirection().multiplyScalar(Math.random() * 0.12) }));
  const palette = ['#22d3ee', '#a78bfa', '#34d399', '#f472b6', '#ffffff'].map((c) => new THREE.Color(c));
  const packets = glowPoints(P, packetSeeds.map((_, i) => palette[i % palette.length]), packetSeeds.map(() => 4 + Math.random() * 6));
  scene.add(packets);

  // stations: gate on the tube, emblem beside it, a branch between them, a date chip
  const up = new THREE.Vector3(0, 1, 0);
  const built = stations.map((st, i) => {
    const anchor = anchors[i];
    const tangent = curve.getTangent(tAt(i)).normalize();
    const side = new THREE.Vector3().crossVectors(tangent, up).normalize().multiplyScalar(i % 2 ? 1 : -1);
    const emblemPos = anchor.clone().addScaledVector(side, 3.4).add(new THREE.Vector3(0, 0.9, 0));

    const gate = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.04, 12, 64), new THREE.MeshBasicMaterial({ color: st.color, transparent: true, opacity: 0.6 }));
    gate.position.copy(anchor);
    gate.lookAt(anchor.clone().add(tangent));
    scene.add(gate);
    const gateGlow = glowPoints(1, new THREE.Color(st.color), 90, 0.4);
    gateGlow.position.copy(anchor);
    scene.add(gateGlow);

    const branch = new THREE.Line(new THREE.BufferGeometry().setFromPoints([anchor, emblemPos.clone().add(new THREE.Vector3(0, -1.3, 0))]),
      new THREE.LineDashedMaterial({ color: st.color, dashSize: 0.15, gapSize: 0.12, transparent: true, opacity: 0.5 }));
    branch.computeLineDistances();
    scene.add(branch);

    const pad = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.56, 64), new THREE.MeshBasicMaterial({ color: st.color, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
    pad.rotation.x = -Math.PI / 2;
    pad.position.copy(emblemPos).add(new THREE.Vector3(0, -1.35, 0));
    scene.add(pad);

    // stand back on the far side of the tube from the emblem, so tube, gate and model are all in frame
    const camPos = anchor.clone().addScaledVector(tangent, -5).addScaledVector(side, -4.2).add(new THREE.Vector3(0, 2.6, 0));
    const look = anchor.clone().lerp(emblemPos, 0.6);

    const emblem = buildEmblem(st.emblem, st.color);
    emblem.group.position.copy(emblemPos);
    emblem.group.lookAt(camPos.clone().setY(emblemPos.y)); // models face the viewer
    scene.add(emblem.group);

    const el = document.createElement('div');
    el.className = 'p-date';
    el.style.setProperty('--c', st.color);
    el.textContent = st.date;
    const chip = new CSS2DObject(el);
    chip.position.copy(anchor).add(new THREE.Vector3(0, 0.95, 0));
    scene.add(chip);

    return { st, gate, gateGlow, pad, emblem, el, camPos, look, emblemPos, active: 0 };
  });

  // stars
  const S = 1800;
  const stars = glowPoints(S, new THREE.Color('#9fb0ff'), Array.from({ length: S }, () => 1.5 + Math.random() * 3), 0.6);
  const sp = stars.geometry.attributes.position.array;
  for (let i = 0; i < S; i++) {
    sp[i * 3] = (Math.random() - 0.5) * 90;
    sp[i * 3 + 1] = (Math.random() - 0.5) * 50;
    sp[i * 3 + 2] = 15 - Math.random() * (n * 10 + 40);
  }
  scene.add(stars);

  const mouse = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => { mouse.x = (e.clientX / innerWidth) * 2 - 1; mouse.y = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });

  let pullBack = 1;
  onResize(container, (w, h) => {
    renderer.setSize(w, h, false);
    labels.setSize(w, h);
    camera.aspect = w / h;
    // push the scene right on desktop (card sits left) and up on mobile (card sits below)
    if (w > 900) camera.setViewOffset(w, h, -w * 0.16, 0, w, h);
    else camera.setViewOffset(w, h, 0, h * 0.07, w, h);
    pullBack = w < 600 ? 1.45 : 1;
    camera.fov = w > 900 ? 48 : 62;
    camera.updateProjectionMatrix();
  });

  let smooth = state.s;
  const camPos = new THREE.Vector3(), look = new THREE.Vector3(), tmp = new THREE.Vector3();
  const smoothstep = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  const motion = reduced ? 0.3 : 1;

  function tick(t, dt) {
    smooth += (state.s - smooth) * (1 - Math.exp(-dt * (reduced ? 20 : 5)));
    const i = Math.min(Math.floor(smooth), n - 2);
    const f = smooth - i;
    const e = smoothstep(0.18, 0.82, f); // dwell at each station
    const A = built[i], B = built[i + 1];
    camPos.lerpVectors(A.camPos, B.camPos, e).add(tmp.set(mouse.x * 0.6, -mouse.y * 0.35 + Math.sin(e * Math.PI) * 1.2, 0));
    look.lerpVectors(A.look, B.look, e);
    camPos.sub(look).multiplyScalar(pullBack).add(look);
    camera.position.copy(camPos);
    camera.lookAt(look);

    const cur = i + e;
    spot.position.copy(look).add(tmp.set(0, 3, 2));
    tubeMat.uniforms.uTime.value = t * motion;

    built.forEach((b, k) => {
      const target = Math.max(0, 1 - Math.abs(cur - k) * 1.6);
      b.active += (target - b.active) * Math.min(1, dt * 4);
      const near = Math.abs(cur - k) < 2.5;
      b.emblem.group.visible = near;
      if (near) b.emblem.update(t * motion, dt, b.active);
      b.emblem.group.scale.setScalar(0.85 + b.active * 0.25);
      b.gate.material.opacity = 0.35 + b.active * 0.65;
      b.gate.rotation.z = t * 0.5;
      b.gate.scale.setScalar(1 + b.active * 0.25);
      b.gateGlow.material.uniforms.uOpacity.value = 0.25 + b.active * 0.6;
      b.pad.material.opacity = 0.15 + b.active * 0.5;
      const d = Math.abs(cur - k);
      b.el.style.opacity = d < 2.2 ? String(Math.max(0.25, 1 - d * 0.35)) : '0';
      b.el.classList.toggle('on', d < 0.5);
    });

    const pa = packets.geometry.attributes.position.array;
    packetSeeds.forEach((p, k) => {
      p.u = (p.u + p.s * dt * motion * 3) % 1;
      curve.getPointAt(p.u, tmp).add(p.off);
      pa[k * 3] = tmp.x; pa[k * 3 + 1] = tmp.y; pa[k * 3 + 2] = tmp.z;
    });
    packets.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
    labels.render(scene, camera);
  }

  return { tick };
}
