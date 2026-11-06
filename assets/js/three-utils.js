import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

export function makeRenderer(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.classList.add('gl');
  container.appendChild(renderer.domElement);
  return renderer;
}

export function makeLabelRenderer(container) {
  const labels = new CSS2DRenderer();
  labels.domElement.classList.add('labels');
  container.appendChild(labels.domElement);
  return labels;
}

export function onResize(container, fn) {
  const run = () => {
    const w = container.clientWidth, h = container.clientHeight;
    if (w && h) fn(w, h);
  };
  new ResizeObserver(run).observe(container);
  run();
}

const glowVert = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  uniform float uPixelRatio;
  varying vec3 vColor;
  void main() {
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (40.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;

const glowFrag = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = pow(smoothstep(0.5, 0.0, d), 1.7);
    gl_FragColor = vec4(vColor * (1.0 + a), a * uOpacity);
    #include <colorspace_fragment>
  }`;

// Soft additive glowing points. colors: array of THREE.Color (or one Color for all), sizes: number[] or number.
export function glowPoints(count, colors, sizes, opacity = 1) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const siz = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const c = Array.isArray(colors) ? colors[i] : colors;
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    siz[i] = Array.isArray(sizes) ? sizes[i] : sizes;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }, uOpacity: { value: opacity } },
    vertexShader: glowVert,
    fragmentShader: glowFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return points;
}

export function fibonacciSphere(n) {
  const out = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    out.push(new THREE.Vector3(Math.cos(golden * i) * r, y, Math.sin(golden * i) * r));
  }
  return out;
}

// Normalised pointer coords inside an element, plus click-vs-drag detection.
export function trackPointer(el, { onClick } = {}) {
  const state = { ndc: new THREE.Vector2(9, 9), inside: false, clientX: 0, clientY: 0 };
  let down = null;
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    state.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    state.inside = true;
    state.clientX = e.clientX; state.clientY = e.clientY;
  });
  el.addEventListener('pointerleave', () => { state.inside = false; state.ndc.set(9, 9); });
  el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  el.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (moved < 6 && onClick) {
      const r = el.getBoundingClientRect();
      state.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      state.clientX = e.clientX; state.clientY = e.clientY;
      onClick(state);
    }
  });
  return state;
}

export function showTooltip(tip, html, x, y) {
  tip.innerHTML = html;
  tip.style.left = `${x}px`;
  tip.style.top = `${y}px`;
  tip.classList.add('show');
}
export function hideTooltip(tip) { tip.classList.remove('show'); }
