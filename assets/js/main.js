import { profile, impact, skillGroups, experience, lanes, projects, education, languages, journey } from './data.js';
import { register } from './loop.js';
import { createSignal } from './signal.js';
import { createProjectAnim } from './project-anims.js';

const $ = (s, root = document) => root.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const laneById = Object.fromEntries(lanes.map((l) => [l.id, l]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const statColors = ['#22d3ee', '#f472b6', '#34d399', '#fbbf24', '#a78bfa', '#38bdf8', '#34d399', '#fb923c'];

let scenes = null; // filled once the 3D module loads

/* ---------- render content ---------- */
$('#summary').textContent = profile.summary;
$('#year').textContent = new Date().getFullYear();

$('#impactGrid').innerHTML = impact.map((s, i) => `
  <div class="stat reveal" style="--c:${statColors[i % statColors.length]}; transition-delay:${i * 60}ms">
    <div class="stat-num" data-count="${s.value}" data-suffix="${esc(s.suffix)}">0${esc(s.suffix)}</div>
    <div class="stat-label">${esc(s.label)}</div>
    <div class="stat-ctx">${esc(s.context)}</div>
  </div>`).join('');

$('#skillLists').innerHTML = skillGroups.map((g) => `
  <div class="skill-card glass reveal" style="--c:${g.color}">
    <h3>${esc(g.name)} <span>${g.items.length}</span></h3>
    <ul class="tags">${g.items.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
  </div>`).join('');

$('#galaxyLegend').innerHTML =
  `<button class="chip-btn active" data-i="-1">All clusters <span class="count">${skillGroups.reduce((n, g) => n + g.items.length, 0)}</span></button>` +
  skillGroups.map((g, i) => `<button class="chip-btn" data-i="${i}" style="--c:${g.color}"><i></i>${esc(g.short)} <span class="count">${g.items.length}</span></button>`).join('');

$('#xpList').innerHTML = experience.map((x) => `
  <article class="xp glass reveal">
    <div class="xp-body">
      <div class="xp-head">
        <div><h3 class="xp-role">${esc(x.role)}</h3><div class="xp-company">${esc(x.company)}</div></div>
        <div class="xp-meta"><div class="mono">${esc(x.period)}</div><div>${esc(x.location)}</div></div>
      </div>
      <ul class="bullets">${x.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      <ul class="tech">${x.tech.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    </div>
    <div class="xp-viz">
      <div class="xp-viz-head mono">
        <b>LSTM anomaly detection · illustrative stream</b>
        <div class="signal-legend"><span style="--c:#22d3ee">signal</span><span style="--c:#a78bfa">expected</span><span style="--c:#f87171">flagged</span></div>
      </div>
      <canvas id="signal" aria-label="Animated chart of a time series with anomalies flagged outside the expected band"></canvas>
      <div class="xp-viz-foot mono">points flagged this session: <span class="xp-counter" id="flagCount">0</span> · simulated data for illustration</div>
    </div>
  </article>`).join('');

const gridProjects = projects.filter((p) => p.kind !== 'work');
$('#projectFilters').innerHTML =
  `<button class="chip-btn active" data-lane="all">All projects <span class="count">${gridProjects.length}</span></button>` +
  lanes.map((l) => `<button class="chip-btn" data-lane="${l.id}" style="--c:${l.color}"><i></i>${esc(l.label)} <span class="count">${gridProjects.filter((p) => p.lane === l.id).length}</span></button>`).join('');

$('#projectGrid').innerHTML = gridProjects.map((p, i) => {
  const lane = laneById[p.lane];
  return `
  <article class="card reveal" data-id="${p.id}" data-lane="${p.lane}" style="--accent:${lane.color}; transition-delay:${(i % 3) * 80}ms" tabindex="0" aria-label="${esc(p.title)}">
    <div class="card-inner">
      <div class="card-viz"><canvas data-anim="${p.id}" aria-hidden="true"></canvas><span class="viz-tag mono">concept animation</span></div>
      <div class="card-top"><span class="lane-tag">${esc(lane.label)}</span><span class="period">${esc(p.period)}</span></div>
      <h3>${esc(p.title)}</h3>
      <p class="card-sub">${esc(p.subtitle)}</p>
      ${p.metric ? `<div class="card-metric"><b>${esc(p.metric.display)}</b><span>${esc(p.metric.label)}</span></div>` : '<div class="card-metric"><b>Live</b><span>interactive Streamlit app</span></div>'}
      <ul class="bullets" style="--accent:${lane.color}">${p.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      <ul class="tech">${p.tech.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <span class="card-link mono">see it in the journey ↑</span>
    </div>
  </article>`;
}).join('');

document.querySelectorAll('canvas[data-anim]').forEach((c) => {
  const id = c.dataset.anim;
  const tick = createProjectAnim(c, id, laneById[projects.find((p) => p.id === id).lane].color);
  if (tick) register(c, (t) => tick(reduced ? 2 : t));
});

$('#eduCard').innerHTML = `
  <div class="edu-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg></div>
  <h3>${esc(education.degree)}</h3>
  <div class="edu-school">${esc(education.school)}</div>
  <div class="edu-meta">${esc(education.location)} · ${esc(education.period)}</div>
  <div class="edu-bar"><div class="edu-track"><div class="edu-fill"></div></div>
  <div class="edu-years"><span>2020</span><span>2021</span><span>2022</span><span>2023</span><span>2024</span></div></div>`;

$('#langCard').innerHTML = languages.map((l) => `
  <div class="lang">
    <div class="lang-head"><h3>${esc(l.name)}</h3><span>${esc(l.level)}</span></div>
    ${l.skills.map((s) => `
      <div class="lang-row"><span>${esc(s.label)}</span>
        <div class="lang-cells" aria-label="${esc(s.cefr)}">${Array.from({ length: 7 }, (_, i) => `<i class="${i < s.score ? 'on' : ''}" style="transition-delay:${i * 90}ms"></i>`).join('')}</div>
        <b>${esc(s.cefr)}</b></div>`).join('')}
  </div>`).join('') + '<p class="edu-meta mono" style="margin-top:14px">scale: A1 · A2 · B1 · B2 · C1 · C2 · native</p>';


const icons = {
  mail: '<path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  link: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 11v5M8 8v.01M12 16v-5M16 16v-3a2 2 0 0 0-4 0"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
};
const svg = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
$('#contactGrid').innerHTML = [
  { k: 'Email', v: profile.email, href: `mailto:${profile.email}`, icon: icons.mail },
  { k: 'Phone', v: profile.phone, href: `tel:${profile.phone.replace(/\s/g, '')}`, icon: icons.phone },
  { k: 'LinkedIn', v: profile.linkedinLabel, href: profile.linkedin, icon: icons.link, ext: true },
  { k: 'Location', v: profile.location, icon: icons.pin },
].map((c) => {
  const inner = `${svg(c.icon)}<span class="ck">${c.k}</span><span class="cv">${esc(c.v)}</span>`;
  return c.href
    ? `<a class="contact-card glass" href="${c.href}"${c.ext ? ' target="_blank" rel="noopener"' : ''}>${inner}</a>`
    : `<div class="contact-card glass">${inner}</div>`;
}).join('');

/* ---------- journey pipeline: scroll position -> station ---------- */
const pipe = $('#pipe');
const journeyState = { s: 0 }; // 0..n-1, read by the 3D pipeline
const N = journey.length;
pipe.style.height = `${N * 75 + 25}vh`;
$('#pipeTotal').textContent = String(N).padStart(2, '0');
$('#pipeRail').innerHTML = journey.map((j, i) => `
  <li><button data-i="${i}" style="--c:${j.color}" aria-label="${esc(j.date)}: ${esc(j.title)}"><i></i><span>${esc(j.date)} · ${esc(j.title)}</span></button></li>`).join('');

function stationScrollY(i) {
  const top = pipe.getBoundingClientRect().top + scrollY;
  return top + (i / (N - 1)) * (pipe.offsetHeight - innerHeight);
}
function goToStation(i) {
  scrollTo({ top: stationScrollY(i), behavior: reduced ? 'auto' : 'smooth' });
}
$('#pipeRail').addEventListener('click', (e) => {
  const b = e.target.closest('[data-i]');
  if (b) goToStation(Number(b.dataset.i));
});

let shownStation = -1;
function renderStation(i) {
  if (i === shownStation) return;
  shownStation = i;
  const j = journey[i];
  const card = $('#pipeCard');
  card.classList.remove('show');
  card.style.setProperty('--c', j.color);
  card.innerHTML = `
    <div class="pc-date mono">${esc(j.date)}</div>
    <h3 class="pc-title">${esc(j.title)}</h3>
    <div class="pc-sub">${esc(j.sub)}</div>
    <p class="pc-text">${esc(j.text)}</p>
    ${j.metric ? `<div class="pc-metric">${esc(j.metric)}</div>` : ''}
    <p class="pc-scene mono">▸ scene: ${esc(j.scene)}</p>
    ${j.project ? `<a class="pc-link mono" href="#projects" data-project="${j.project}">project details ↓</a>` : ''}
    ${j.cta ? '<a class="btn btn-primary btn-sm pc-cta" href="#contact">Get in touch</a>' : ''}`;
  void card.offsetWidth;
  card.classList.add('show');
  $('#pipeIndex').textContent = String(i + 1).padStart(2, '0');
  document.querySelectorAll('#pipeRail button').forEach((b, k) => {
    b.classList.toggle('on', k === i);
    b.classList.toggle('past', k < i);
  });
}
$('#pipeCard').addEventListener('click', (e) => {
  const a = e.target.closest('[data-project]');
  if (!a) return;
  e.preventDefault();
  const card = document.querySelector(`.card[data-id="${a.dataset.project}"]`);
  card?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  card?.classList.add('flash');
  setTimeout(() => card?.classList.remove('flash'), 1600);
});

function updatePipe() {
  const r = pipe.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, -r.top / (pipe.offsetHeight - innerHeight)));
  journeyState.s = p * (N - 1);
  renderStation(Math.round(journeyState.s));
}
addEventListener('scroll', updatePipe, { passive: true });
addEventListener('resize', updatePipe);
updatePipe();

/* ---------- project grid: filters, tilt, link to 3D ---------- */
$('#projectFilters').addEventListener('click', (e) => {
  const b = e.target.closest('[data-lane]');
  if (!b) return;
  document.querySelectorAll('#projectFilters .chip-btn').forEach((x) => x.classList.toggle('active', x === b));
  document.querySelectorAll('.card').forEach((c) => c.classList.toggle('hidden', b.dataset.lane !== 'all' && c.dataset.lane !== b.dataset.lane));
});

document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    card.style.setProperty('--mx', `${x * 100}%`);
    card.style.setProperty('--my', `${y * 100}%`);
    if (!reduced && e.pointerType === 'mouse') {
      card.style.setProperty('--rx', `${(0.5 - y) * 8}deg`);
      card.style.setProperty('--ry', `${(x - 0.5) * 10}deg`);
    }
  });
  card.addEventListener('pointerleave', () => {
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  });
  const open = () => goToStation(journey.findIndex((j) => j.project === card.dataset.id));
  card.addEventListener('click', open);
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
});

/* ---------- galaxy legend ---------- */
$('#galaxyLegend').addEventListener('click', (e) => {
  const b = e.target.closest('[data-i]');
  if (!b) return;
  setLegend(Number(b.dataset.i));
  scenes?.galaxy?.focus(Number(b.dataset.i));
});
function setLegend(i) {
  document.querySelectorAll('#galaxyLegend .chip-btn').forEach((x) => x.classList.toggle('active', Number(x.dataset.i) === i));
}

/* ---------- nav, progress, reveal ---------- */
const nav = $('#nav');
const progress = $('#progress');
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  nav.classList.toggle('scrolled', scrollY > 40);
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

$('#navToggle').addEventListener('click', () => {
  const open = document.body.classList.toggle('nav-open');
  $('#navToggle').setAttribute('aria-expanded', open);
});
document.querySelectorAll('.nav-links a').forEach((a) => a.addEventListener('click', () => document.body.classList.remove('nav-open')));

const navLinks = [...document.querySelectorAll('.nav-links a')];
const sectionIO = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${en.target.id}`));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main > section[id]').forEach((s) => sectionIO.observe(s));

const revealIO = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in');
    en.target.querySelectorAll('[data-count]').forEach(countUp);
    if (en.target.matches('[data-count]')) countUp(en.target);
    revealIO.unobserve(en.target);
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => revealIO.observe(el));

function countUp(el) {
  const target = Number(el.dataset.count), suffix = el.dataset.suffix || '';
  const fmt = (n) => Math.round(n).toLocaleString('en-US') + suffix;
  if (reduced) { el.textContent = fmt(target); return; }
  const start = performance.now(), dur = 1600;
  const step = (now) => {
    const k = Math.min((now - start) / dur, 1);
    el.textContent = fmt(target * (1 - Math.pow(1 - k, 4)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- typed role ---------- */
(function typed() {
  const el = $('#typed');
  if (reduced) { el.textContent = profile.roles.join(' · '); return; }
  let r = 0, i = profile.roles[0].length, deleting = true;
  setTimeout(function loop() {
    const word = profile.roles[r];
    if (deleting) {
      i--;
      if (i === 0) { deleting = false; r = (r + 1) % profile.roles.length; }
    } else {
      i++;
      if (i === profile.roles[r].length) { deleting = true; el.textContent = profile.roles[r]; return setTimeout(loop, 2200); }
    }
    el.textContent = (deleting ? word : profile.roles[r]).slice(0, i);
    setTimeout(loop, deleting ? 35 : 70);
  }, 2400);
})();

/* ---------- 2D signal chart ---------- */
const signalCanvas = $('#signal');
register(signalCanvas, createSignal(signalCanvas, $('#flagCount')));

/* ---------- 3D scenes (loaded separately so content works without WebGL) ---------- */
import('./scenes.js')
  .then((m) => {
    scenes = m.start({
      hero: $('#heroCanvas'),
      galaxy: $('#galaxy'),
      pipe: $('#pipeCanvas'),
      journeyState,
      tooltip: $('#tooltip'),
      reduced,
      onFocusCluster: (i) => setLegend(i),
    });
  })
  .catch((err) => {
    console.warn('3D disabled:', err);
    document.body.classList.add('no-webgl');
  });
