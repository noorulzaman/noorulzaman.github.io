// One shared animation loop. Each registered item only ticks while its element is on screen.
const items = [];

export function register(el, tick) {
  const item = { tick, visible: false };
  new IntersectionObserver(([entry]) => { item.visible = entry.isIntersecting; }, { rootMargin: '120px' }).observe(el);
  items.push(item);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (!document.hidden) {
    const t = now / 1000;
    for (const item of items) if (item.visible) item.tick(t, dt);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
