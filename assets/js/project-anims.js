// Small canvas animations on the project cards, each acting out the project's core idea.
// Each draw(ctx, w, h, t, s) gets a persistent state object `s`.

const TAU = Math.PI * 2;
const ease = (x) => x * x * (3 - 2 * x);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const lerp = (a, b, k) => a + (b - a) * k;
const FONT = '10px "JetBrains Mono", monospace';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
}
function dot(ctx, x, y, r, color, glow = 0) {
  ctx.save();
  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.restore();
}
function label(ctx, text, x, y, color = '#8f96b8', align = 'center', font = FONT) {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}
function box(ctx, x, y, w, h, color, tag) {
  ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  if (tag) {
    ctx.font = '9px "JetBrains Mono", monospace';
    const tw = ctx.measureText(tag).width + 8;
    ctx.fillStyle = color; ctx.fillRect(x - 0.75, y - 13, tw, 13);
    ctx.fillStyle = '#05060f'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(tag, x + 3, y - 6.5);
  }
}
// rotating point cloud projected to 2D
function project(p, a, cx, cy, R) {
  const x = p[0] * Math.cos(a) - p[2] * Math.sin(a);
  const z = p[0] * Math.sin(a) + p[2] * Math.cos(a);
  const k = 3 / (3 + z);
  return { x: cx + x * R * k, y: cy + p[1] * R * k, k };
}
const sphere = (n, r = 1) => Array.from({ length: n }, () => {
  const u = Math.random() * 2 - 1, a = Math.random() * TAU, m = Math.cbrt(Math.random()) * r;
  return [Math.sqrt(1 - u * u) * Math.cos(a) * m, u * m, Math.sqrt(1 - u * u) * Math.sin(a) * m];
});

/* StaffViz: employee -> agent -> tool -> agent -> employee */
function staffviz(ctx, w, h, t, s, accent) {
  const user = { x: w * 0.12, y: h * 0.5, n: 'Employee', c: '#e2e8f0' };
  const agent = { x: w * 0.45, y: h * 0.5, n: 'Agent · GPT-4o', c: accent };
  const tools = [
    { x: w * 0.82, y: h * 0.2, n: 'Browser', c: '#38bdf8' },
    { x: w * 0.86, y: h * 0.52, n: 'Policy DB', c: '#fbbf24' },
    { x: w * 0.82, y: h * 0.82, n: 'Leave API', c: '#f472b6' },
  ];
  const step = 0.7, cyc = Math.floor(t / (step * 4)), st = Math.floor(t / step) % 4, f = (t % step) / step;
  const tool = tools[cyc % 3];
  const legs = [[user, agent], [agent, tool], [tool, agent], [agent, user]];
  const [a, b] = legs[st];
  [[user, agent], ...tools.map((x) => [agent, x])].forEach(([p, q]) => {
    const on = (p === a && q === b) || (p === b && q === a);
    ctx.strokeStyle = on ? accent : 'rgba(255,255,255,0.1)';
    ctx.lineWidth = on ? 1.6 : 1;
    ctx.setLineDash(on ? [] : [3, 4]);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
  });
  ctx.setLineDash([]);
  const k = ease(f);
  for (let i = 0; i < 5; i++) {
    const kk = Math.max(0, k - i * 0.04);
    dot(ctx, lerp(a.x, b.x, kk), lerp(a.y, b.y, kk), 3.5 - i * 0.6, '#ffffff', i ? 0 : 12);
  }
  [user, ...tools].forEach((nd) => {
    const hot = nd === b && f > 0.85;
    dot(ctx, nd.x, nd.y, hot ? 9 : 7, nd.c, hot ? 18 : 6);
    label(ctx, nd.n, nd.x, nd.y + 17);
  });
  const pulse = 13 + Math.sin(t * 4) * 1.5;
  dot(ctx, agent.x, agent.y, pulse, accent, 24);
  dot(ctx, agent.x, agent.y, 5, '#05060f');
  label(ctx, agent.n, agent.x, agent.y + 26, '#e8eaf6');
  const phases = ['ask', 'act', 'observe', 'answer'];
  let px = 12;
  ctx.font = FONT;
  phases.forEach((p, i) => { label(ctx, p, px, 14, i === st ? accent : '#5d6488', 'left'); px += ctx.measureText(p).width + 12; });
  label(ctx, `tickets resolved ${String(Math.floor(t / (step * 4))).padStart(3, '0')}`, w - 10, 14, '#8f96b8', 'right');
}

/* Intelligent ATS: candidates in embedding space ranked against a job */
function ats(ctx, w, h, t, s, accent) {
  if (!s.pts) { s.pts = sphere(42, 1); s.job = [0.2, 0, 0.1]; s.cyc = -1; s.bars = [0, 0, 0, 0, 0]; }
  const cyc = Math.floor(t / 4);
  if (cyc !== s.cyc) { s.cyc = cyc; s.job = sphere(1, 0.7)[0]; }
  const dist = (p) => Math.hypot(p[0] - s.job[0], p[1] - s.job[1], p[2] - s.job[2]);
  const ranked = s.pts.map((p, i) => ({ i, d: dist(p) })).sort((a, b) => a.d - b.d);
  const top = new Set(ranked.slice(0, 5).map((r) => r.i));
  const a = t * 0.45, cx = w * 0.3, cy = h * 0.52, R = Math.min(w * 0.22, h * 0.38);
  const J = project(s.job, a, cx, cy, R);
  ranked.slice(0, 5).forEach((r) => {
    const P = project(s.pts[r.i], a, cx, cy, R);
    ctx.strokeStyle = 'rgba(251,191,36,0.45)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(J.x, J.y); ctx.lineTo(P.x, P.y); ctx.stroke();
  });
  s.pts.forEach((p, i) => {
    const P = project(p, a, cx, cy, R);
    dot(ctx, P.x, P.y, (top.has(i) ? 3.6 : 2.2) * P.k, top.has(i) ? accent : 'rgba(180,190,230,0.45)', top.has(i) ? 8 : 0);
  });
  ctx.save(); ctx.translate(J.x, J.y); ctx.rotate(t);
  ctx.fillStyle = '#fbbf24'; ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 14;
  ctx.beginPath();
  for (let k = 0; k < 10; k++) { const r = k % 2 ? 3 : 7.5; ctx.lineTo(Math.cos((k / 10) * TAU) * r, Math.sin((k / 10) * TAU) * r); }
  ctx.fill(); ctx.restore();
  label(ctx, 'job', J.x, J.y - 14, '#fbbf24');
  const x0 = w * 0.58, bw = w - x0 - 68;
  label(ctx, 'ranked candidates', x0, 16, '#8f96b8', 'left');
  ranked.slice(0, 5).forEach((r, k) => {
    const score = Math.max(0.05, 1 - r.d / 2.2);
    s.bars[k] = lerp(s.bars[k], score, 0.08);
    const y = 34 + k * ((h - 44) / 5);
    label(ctx, `#${k + 1}`, x0, y + 5, k === 0 ? accent : '#8f96b8', 'left');
    rr(ctx, x0 + 24, y, bw, 10, 5); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill();
    rr(ctx, x0 + 24, y, bw * s.bars[k], 10, 5); ctx.fillStyle = k === 0 ? accent : 'rgba(52,211,153,0.5)'; ctx.fill();
    label(ctx, s.bars[k].toFixed(2), x0 + 30 + bw, y + 5, '#c3c8e2', 'left');
  });
}

/* Enterprise RAG: sources -> chunks -> vector space -> top-k -> answer */
function rag(ctx, w, h, t, s, accent) {
  if (!s.pts) { s.pts = sphere(34, 1); s.cyc = -1; s.top = []; }
  const srcs = [{ n: 'PDF', c: '#f87171' }, { n: 'DB', c: '#38bdf8' }, { n: 'API', c: '#fbbf24' }];
  const sy = (i) => h * (0.25 + i * 0.25);
  srcs.forEach((sr, i) => {
    rr(ctx, 10, sy(i) - 11, 40, 22, 6); ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fill();
    ctx.strokeStyle = sr.c; ctx.lineWidth = 1.2; ctx.stroke();
    label(ctx, sr.n, 30, sy(i), sr.c);
  });
  const a = t * 0.35, cx = w * 0.47, cy = h * 0.52, R = Math.min(w * 0.17, h * 0.36);
  const P = s.pts.map((p) => project(p, a, cx, cy, R));
  for (let i = 0; i < 9; i++) {
    const k = (t * 0.45 + i / 9) % 1, src = i % 3, tgt = P[(i * 7) % P.length];
    dot(ctx, lerp(52, tgt.x, ease(k)), lerp(sy(src), tgt.y, ease(k)), 2.4, srcs[src].c);
  }
  const cyc = Math.floor(t / 3.5), k = (t % 3.5) / 3.5;
  if (cyc !== s.cyc) { s.cyc = cyc; s.top = [...s.pts.keys()].sort(() => Math.random() - 0.5).slice(0, 4); }
  const ax = w * 0.84, ay = h * 0.5;
  const qk = clamp01(k / 0.25);
  if (k < 0.3) { dot(ctx, lerp(ax, cx, ease(qk)), lerp(h * 0.12, cy, ease(qk)), 4, '#ffffff', 10); label(ctx, 'query', lerp(ax, cx, ease(qk)), lerp(h * 0.12, cy, ease(qk)) - 11, '#e8eaf6'); }
  P.forEach((p, i) => {
    const hit = s.top.includes(i) && k > 0.3;
    dot(ctx, p.x, p.y, (hit ? 4 : 2.2) * p.k, hit ? accent : 'rgba(170,200,255,0.5)', hit ? 10 : 0);
    if (hit && k > 0.4) {
      const e = clamp01((k - 0.4) / 0.25);
      ctx.strokeStyle = 'rgba(52,211,153,0.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(lerp(p.x, ax - 30, e), lerp(p.y, ay, e)); ctx.stroke();
    }
  });
  label(ctx, 'vector + keyword index', cx, h - 10, '#5d6488');
  rr(ctx, ax - 30, ay - 30, 60, 60, 10); ctx.fillStyle = 'rgba(52,211,153,0.06)'; ctx.fill();
  ctx.strokeStyle = k > 0.6 ? accent : 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1.2; ctx.stroke();
  label(ctx, 'answer', ax, ay - 40, '#8f96b8');
  const typed = clamp01((k - 0.62) / 0.3);
  [0.8, 0.6, 0.9, 0.5].forEach((len, i) => {
    const l = clamp01(typed * 4 - i) * len * 44;
    if (l > 0) { ctx.fillStyle = 'rgba(232,234,246,0.7)'; ctx.fillRect(ax - 22, ay - 16 + i * 10, l, 3); }
  });
}

/* Smart Security: CCTV frame, people tracked, one flagged with a weapon, alert sent */
function weapon(ctx, w, h, t, s, accent) {
  rr(ctx, 6, 6, w - 12, h - 12, 10); ctx.fillStyle = '#060912'; ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let y = 8; y < h - 8; y += 3) ctx.fillRect(8, y, w - 16, 1);
  ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(6, h * 0.8, w - 12, 1);
  const cyc = (t % 7) / 7, armed = cyc > 0.3 && cyc < 0.9;
  const people = [{ o: 0, v: 0.07 }, { o: 0.45, v: 0.06, threat: true }, { o: 0.8, v: 0.05 }];
  people.forEach((p, i) => {
    const x = ((t * p.v + p.o) % 1.2 - 0.1) * w, gy = h * 0.8, ph = h * 0.5;
    const step = Math.sin(t * 6 + i) * 3;
    ctx.fillStyle = '#334155';
    dot(ctx, x, gy - ph + 8, ph * 0.12, '#475569');
    rr(ctx, x - ph * 0.13, gy - ph + ph * 0.25, ph * 0.26, ph * 0.45, 6); ctx.fill();
    ctx.fillRect(x - 5 + step * 0.5, gy - ph * 0.3, 4, ph * 0.3);
    ctx.fillRect(x + 1 - step * 0.5, gy - ph * 0.3, 4, ph * 0.3);
    const isThreat = p.threat && armed;
    if (isThreat) { ctx.fillStyle = '#94a3b8'; ctx.fillRect(x + ph * 0.13, gy - ph * 0.52, ph * 0.18, 4); }
    const bx = x - ph * 0.22, by = gy - ph - 2, bw = ph * 0.44, bh = ph + 2;
    box(ctx, bx, by, bw, bh, isThreat ? '#f87171' : 'rgba(34,211,238,0.8)', isThreat ? 'weapon' : 'person');
  });
  label(ctx, 'CAM 03', 16, 18, '#8f96b8', 'left');
  if (Math.sin(t * 5) > 0) dot(ctx, 62, 18, 3, '#f87171', 6);
  const sec = Math.floor(t) % 60;
  label(ctx, `21:4${Math.floor(t / 60) % 10}:${String(sec).padStart(2, '0')}`, w - 16, 18, '#8f96b8', 'right');
  if (armed) {
    const k = clamp01((cyc - 0.35) / 0.08);
    const x = lerp(w + 10, w - 120, ease(k));
    rr(ctx, x, 30, 108, 24, 7); ctx.fillStyle = 'rgba(248,113,113,0.15)'; ctx.fill();
    ctx.strokeStyle = '#f87171'; ctx.lineWidth = 1; ctx.stroke();
    label(ctx, '⚠ alert sent', x + 54, 42, Math.sin(t * 10) > -0.3 ? '#fecaca' : '#f87171');
  }
}

/* VISIONARY: street with multiple detectors + LSTM temporal window */
function visionary(ctx, w, h, t, s, accent) {
  const roadH = h * 0.72, hy = 18, by = roadH;
  const vx = w * 0.5;
  const half = (d) => lerp(w * 0.04, w * 0.46, d);
  const Y = (d) => lerp(hy, by, d);
  ctx.fillStyle = '#0b1020';
  ctx.beginPath(); ctx.moveTo(vx - half(0), Y(0)); ctx.lineTo(vx + half(0), Y(0)); ctx.lineTo(vx + half(1), Y(1)); ctx.lineTo(vx - half(1), Y(1)); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
  for (let k = 0; k < 8; k++) {
    const d0 = ((k / 8 + t * 0.25) % 1) ** 1.8, d1 = Math.min(1, d0 + 0.04);
    ctx.beginPath(); ctx.moveTo(vx, Y(d0)); ctx.lineTo(vx, Y(d1)); ctx.stroke();
  }
  const car = (d, lane, color, tag, tagColor) => {
    const x = vx + lane * half(d) * 0.5, y = Y(d), sz = half(d) * 0.3;
    ctx.fillStyle = color; rr(ctx, x - sz / 2, y - sz * 0.6, sz, sz * 0.6, 3); ctx.fill();
    if (tag) box(ctx, x - sz / 2 - 3, y - sz * 0.6 - 3, sz + 6, sz * 0.6 + 6, tagColor, tag);
  };
  car(((t * 0.18) % 1) ** 1.6, 1, '#64748b', 'vehicle', 'rgba(34,211,238,0.8)');
  car(((t * 0.18 + 0.5) % 1) ** 1.6, 1, '#64748b');
  car((1 - ((t * 0.15) % 1)) ** 1.6, -1, '#38bdf8', 'wrong-way', '#f87171');
  const pd = 0.72, px = vx + 0.45 * half(pd) * 0.5 - 30, py = Y(pd);
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(px, py, 12, 4, 0, 0, TAU); ctx.fill();
  box(ctx, px - 16, py - 8, 32, 16, '#fbbf24', 'pothole');
  const fx = w * 0.09, fy = roadH - 6;
  ctx.fillStyle = '#1e293b'; ctx.fillRect(fx - 18, fy - 46, 36, 46);
  for (let i = 0; i < 14; i++) {
    const k = (t * 1.2 + i / 14) % 1;
    dot(ctx, fx + Math.sin(i * 5 + t * 4) * 8 * (1 - k), fy - 46 - k * 26, 4 * (1 - k) + 1, i % 3 ? '#fb923c' : '#fde047', 6);
  }
  box(ctx, fx - 22, fy - 76, 44, 76, '#fb923c', 'fire');
  const strip = h - roadH - 10, sy0 = roadH + 6, tiles = 14, tw = (w - 20) / tiles;
  const win = Math.floor(t * 2) % (tiles - 3);
  for (let i = 0; i < tiles; i++) {
    ctx.fillStyle = i >= win && i < win + 4 ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.05)';
    ctx.fillRect(10 + i * tw + 1, sy0, tw - 2, strip - 12);
  }
  ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 1.5;
  ctx.strokeRect(10 + win * tw, sy0 - 1, tw * 4, strip - 10);
  label(ctx, 'LSTM temporal window → accident?', w - 12, h - 6, '#a78bfa', 'right');
}

/* Age & Gender: face scan -> landmarks -> predicted distribution */
function agegender(ctx, w, h, t, s, accent) {
  const faces = [
    { hair: '#475569', skin: '#e2b48f', age: 2, g: ['F', 0.94] },
    { hair: '#1e293b', skin: '#c68b62', age: 4, g: ['M', 0.91] },
    { hair: '#94a3b8', skin: '#f1c8a5', age: 6, g: ['F', 0.88] },
  ];
  const T = 3.6, idx = Math.floor(t / T) % 3, k = (t % T) / T, f = faces[idx];
  const cx = w * 0.27, cy = h * 0.52, fr = Math.min(h * 0.32, w * 0.15);
  ctx.globalAlpha = k < 0.08 ? k / 0.08 : k > 0.92 ? (1 - k) / 0.08 : 1;
  ctx.fillStyle = f.hair; ctx.beginPath(); ctx.ellipse(cx, cy - fr * 0.15, fr * 0.95, fr * 1.05, 0, Math.PI, TAU); ctx.fill();
  ctx.fillStyle = f.skin; ctx.beginPath(); ctx.ellipse(cx, cy + fr * 0.05, fr * 0.78, fr * 0.95, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1e293b';
  dot(ctx, cx - fr * 0.3, cy - fr * 0.05, fr * 0.07, '#1e293b');
  dot(ctx, cx + fr * 0.3, cy - fr * 0.05, fr * 0.07, '#1e293b');
  ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy + fr * 0.35, fr * 0.22, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.globalAlpha = 1;
  const scanY = cy - fr + clamp01(k / 0.4) * fr * 2;
  if (k < 0.42) {
    const g = ctx.createLinearGradient(0, scanY - 14, 0, scanY);
    g.addColorStop(0, 'rgba(244,114,182,0)'); g.addColorStop(1, 'rgba(244,114,182,0.5)');
    ctx.fillStyle = g; ctx.fillRect(cx - fr, scanY - 14, fr * 2, 14);
    ctx.fillStyle = accent; ctx.fillRect(cx - fr, scanY, fr * 2, 1.5);
  }
  const lms = [[-0.3, -0.05], [0.3, -0.05], [0, 0.15], [-0.2, 0.4], [0.2, 0.4], [0, 0.48], [-0.6, 0.1], [0.6, 0.1], [0, -0.45]];
  lms.forEach(([x, y]) => { if (cy + y * fr < scanY || k > 0.42) dot(ctx, cx + x * fr, cy + y * fr, 2, '#ffffff', 6); });
  const L = fr * 0.3, bx = cx - fr * 1.05, byy = cy - fr * 1.15, bw = fr * 2.1, bh = fr * 2.3;
  ctx.strokeStyle = accent; ctx.lineWidth = 2;
  [[bx, byy, 1, 1], [bx + bw, byy, -1, 1], [bx, byy + bh, 1, -1], [bx + bw, byy + bh, -1, -1]].forEach(([x, y, sx, sy]) => {
    ctx.beginPath(); ctx.moveTo(x + sx * L, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * L); ctx.stroke();
  });
  const x0 = w * 0.56, pw = w * 0.38, reveal = ease(clamp01((k - 0.45) / 0.3));
  label(ctx, 'age', x0, 18, '#8f96b8', 'left');
  const bins = ['0-2', '4-6', '8-12', '15-20', '25-32', '38-43', '48-53', '60+'];
  const bw2 = pw / bins.length;
  bins.forEach((b, i) => {
    const v = Math.exp(-((i - f.age) ** 2) / 1.2) * 0.9 + 0.06;
    const bh2 = v * h * 0.42 * reveal;
    ctx.fillStyle = i === f.age ? accent : 'rgba(255,255,255,0.15)';
    ctx.fillRect(x0 + i * bw2 + 1, h * 0.62 - bh2, bw2 - 3, bh2);
  });
  label(ctx, bins[f.age], x0 + f.age * bw2 + bw2 / 2, h * 0.62 - h * 0.42 * reveal - 8, '#e8eaf6');
  label(ctx, 'gender', x0, h * 0.76, '#8f96b8', 'left');
  rr(ctx, x0 + 52, h * 0.76 - 5, pw - 90, 10, 5); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill();
  rr(ctx, x0 + 52, h * 0.76 - 5, (pw - 90) * f.g[1] * reveal, 10, 5); ctx.fillStyle = accent; ctx.fill();
  label(ctx, `${f.g[0]} ${(f.g[1] * reveal).toFixed(2)}`, x0 + pw - 34, h * 0.76, '#e8eaf6', 'left');
  label(ctx, 'streamlit · upload → predict', x0, h - 12, '#5d6488', 'left');
}

/* Sentiment: tweets -> model -> positive / neutral / negative */
function sentiment(ctx, w, h, t, s, accent) {
  if (!s.counts) s.counts = [0, 0, 0];
  const cls = [{ n: 'positive', c: '#34d399' }, { n: 'neutral', c: '#94a3b8' }, { n: 'negative', c: '#f87171' }];
  const mx = w * 0.45, my = h * 0.5;
  for (let i = 0; i < 10; i++) {
    const k = (t * 0.3 + i / 10) % 1;
    const c = (i * 7) % 10 < 3 ? 0 : (i * 7) % 10 < 5 ? 1 : 2;
    const yIn = h * (0.18 + ((i * 37) % 10) / 14);
    if (k < 0.5) {
      const e = k / 0.5, x = lerp(-30, mx - 72, e), y = lerp(yIn, my, e * e);
      rr(ctx, x, y - 8, 38, 16, 8); ctx.fillStyle = 'rgba(56,189,248,0.15)'; ctx.fill();
      ctx.strokeStyle = 'rgba(56,189,248,0.6)'; ctx.lineWidth = 1; ctx.stroke();
      label(ctx, `✈ ${'ABCDEF'[i % 6]}`, x + 19, y, '#bae6fd');
    } else {
      const e = (k - 0.5) / 0.5, tx = w * 0.8, ty = h * (0.25 + c * 0.25);
      dot(ctx, lerp(mx + 30, tx - 40, e), lerp(my, ty, ease(e)), 4, cls[c].c, 8);
    }
  }
  rr(ctx, mx - 30, my - 22, 60, 44, 10); ctx.fillStyle = 'rgba(251,191,36,0.1)'; ctx.fill();
  ctx.strokeStyle = accent; ctx.lineWidth = 1.4; ctx.stroke();
  label(ctx, 'R model', mx, my - 6, '#fde68a');
  label(ctx, 'regression', mx, my + 8, '#8f96b8');
  const cyc = (t % 12) / 12;
  const share = [0.3, 0.2, 0.5];
  cls.forEach((c, i) => {
    const y = h * (0.25 + i * 0.25), x = w * 0.8 - 30, bw = w * 0.18;
    label(ctx, c.n, x, y - 11, c.c, 'left');
    rr(ctx, x, y - 4, bw, 8, 4); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill();
    rr(ctx, x, y - 4, bw * share[i] * 1.6 * ease(clamp01(cyc * 1.2)), 8, 4); ctx.fillStyle = c.c; ctx.fill();
  });
  label(ctx, `tweets classified ${Math.round(14000 * ease(clamp01(cyc * 1.2))).toLocaleString('en-US')} / 14,000`, 10, 14, '#8f96b8', 'left');
}

const anims = { staffviz, ats, rag, weapon, visionary, agegender, sentiment };

export function createProjectAnim(canvas, id, accent) {
  const draw = anims[id];
  if (!draw) return null;
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0;
  const state = {};
  new ResizeObserver(() => {
    const dpr = Math.min(window.devicePixelRatio, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }).observe(canvas);
  return (t) => {
    if (!w) return;
    ctx.clearRect(0, 0, w, h);
    draw(ctx, w, h, t, state, accent);
  };
}
