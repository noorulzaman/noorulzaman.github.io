// Illustrative live chart: a streaming signal, a model's expected band, and points flagged outside it.
export function createSignal(canvas, counterEl) {
  const ctx = canvas.getContext('2d');
  const N = 240, BAND = 0.28, STEP = 0.045;
  let w = 0, h = 0, k = 0, acc = 0, flagged = 0;
  const data = [];

  function sample() {
    k++;
    const expected = Math.sin(k * 0.07) * 0.45 + Math.sin(k * 0.019 + 1) * 0.3;
    let v = expected + (Math.random() - 0.5) * 0.14;
    if (Math.random() < 0.025) v += (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5);
    const anomaly = Math.abs(v - expected) > BAND;
    if (anomaly) flagged++;
    return { v, expected, anomaly };
  }
  for (let i = 0; i < N; i++) data.push(sample());
  flagged = 0;

  new ResizeObserver(() => {
    const dpr = Math.min(window.devicePixelRatio, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }).observe(canvas);

  const X = (i) => (i / (N - 1)) * w;
  const Y = (v) => h / 2 - v * h * 0.33;

  function draw(t) {
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let gy = 1; gy < 6; gy++) {
      ctx.beginPath(); ctx.moveTo(0, (gy / 6) * h); ctx.lineTo(w, (gy / 6) * h); ctx.stroke();
    }

    // expected band
    ctx.beginPath();
    data.forEach((d, i) => ctx.lineTo(X(i), Y(d.expected + BAND)));
    for (let i = N - 1; i >= 0; i--) ctx.lineTo(X(i), Y(data[i].expected - BAND));
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(167,139,250,0)');
    g.addColorStop(0.2, 'rgba(167,139,250,0.14)');
    g.addColorStop(1, 'rgba(167,139,250,0.2)');
    ctx.fillStyle = g;
    ctx.fill();

    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = 'rgba(167,139,250,0.7)';
    ctx.beginPath();
    data.forEach((d, i) => ctx.lineTo(X(i), Y(d.expected)));
    ctx.stroke();
    ctx.setLineDash([]);

    // signal
    const sg = ctx.createLinearGradient(0, 0, w, 0);
    sg.addColorStop(0, 'rgba(34,211,238,0)');
    sg.addColorStop(0.15, 'rgba(34,211,238,0.9)');
    sg.addColorStop(1, '#22d3ee');
    ctx.strokeStyle = sg;
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 8;
    ctx.beginPath();
    data.forEach((d, i) => ctx.lineTo(X(i), Y(d.v)));
    ctx.stroke();
    ctx.shadowBlur = 0;

    // anomalies
    data.forEach((d, i) => {
      if (!d.anomaly) return;
      const x = X(i), y = Y(d.v);
      const pulse = (t * 1.5 + i * 0.1) % 1;
      ctx.strokeStyle = `rgba(248,113,113,${0.8 * (1 - pulse)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, 5 + pulse * 12, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#f87171';
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
    });

    // scan head
    const hx = X(N - 1) - 1, hy = Y(data[N - 1].v);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(hx, hy, 3, 0, Math.PI * 2); ctx.fill();
  }

  return function tick(t, dt) {
    acc += dt;
    while (acc > STEP) { acc -= STEP; data.shift(); data.push(sample()); }
    if (counterEl) counterEl.textContent = flagged;
    draw(t);
  };
}
