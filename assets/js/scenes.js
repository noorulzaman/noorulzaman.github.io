import { skillGroups, projects, lanes } from './data.js';
import { register } from './loop.js';
import { createHero } from './hero.js';
import { createGalaxy } from './galaxy.js';
import { createSpace } from './space.js';

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

export function start({ hero, galaxy, space, tooltip, reduced, onSelectProject, onFocusCluster }) {
  if (!webglAvailable()) throw new Error('WebGL not available');

  const h = createHero(hero, { reduced });
  register(hero, h.tick);

  const g = createGalaxy(galaxy, skillGroups, { tooltip, reduced, onFocus: onFocusCluster });
  register(galaxy, g.tick);

  const s = createSpace(space, projects, lanes, { tooltip, reduced, onSelect: onSelectProject });
  register(space, s.tick);

  return { hero: h, galaxy: g, space: s };
}
