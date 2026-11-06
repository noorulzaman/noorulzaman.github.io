import { skillGroups, journey } from './data.js';
import { register } from './loop.js';
import { createHero } from './hero.js';
import { createGalaxy } from './galaxy.js';
import { createPipeline } from './pipeline.js';

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

export function start({ hero, galaxy, pipe, journeyState, tooltip, reduced, onFocusCluster }) {
  if (!webglAvailable()) throw new Error('WebGL not available');

  const h = createHero(hero, { reduced });
  register(hero, h.tick);

  const g = createGalaxy(galaxy, skillGroups, { tooltip, reduced, onFocus: onFocusCluster });
  register(galaxy, g.tick);

  const p = createPipeline(pipe, journey, journeyState, { reduced });
  register(pipe, p.tick);

  return { hero: h, galaxy: g, pipeline: p };
}
