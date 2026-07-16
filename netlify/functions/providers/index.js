// Provider registry. The identify() function talks to providers only through this
// selector, so a second engine (iNaturalist CV, Plant.id, ...) can be added later
// with the same identify({...}) signature and normalized return shape — without
// touching the frontend or the handler.

import * as plantnet from './plantnet.js';

const PROVIDERS = {
  plantnet,
};

export function getProvider(name) {
  const p = PROVIDERS[name];
  if (!p) throw new Error(`Unknown provider: ${name}`);
  return p;
}
