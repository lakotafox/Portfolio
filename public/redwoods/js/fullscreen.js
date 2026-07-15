// Fullscreen toggle as a Leaflet control. Implemented as a fixed-position
// CSS overlay (not the Fullscreen API, which iOS Safari doesn't support
// for page elements). Esc also exits.
import { REDUCED_MOTION } from './map.js';

const L = window.L;

const EXPAND_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`;
const MINIMIZE_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>`;

export function initFullscreen(map) {
  let on = false;
  let btn;

  function render() {
    btn.innerHTML = on ? MINIMIZE_ICON : EXPAND_ICON;
    btn.setAttribute('aria-label', on ? 'Exit fullscreen map' : 'Fullscreen map');
    btn.title = on ? 'Minimize' : 'Fullscreen';
  }

  function setFullscreen(next) {
    on = next;
    document.body.classList.toggle('map-fullscreen', on);
    render();
    map.invalidateSize({ animate: !REDUCED_MOTION });
    if (!on) document.getElementById('map').scrollIntoView({ block: 'nearest' });
  }

  const Control = L.Control.extend({
    onAdd() {
      const wrap = L.DomUtil.create('div', 'leaflet-bar');
      btn = L.DomUtil.create('button', 'fullscreen-btn', wrap);
      btn.type = 'button';
      render();
      L.DomEvent.disableClickPropagation(wrap);
      L.DomEvent.on(btn, 'click', () => setFullscreen(!on));
      return wrap;
    },
  });
  new Control({ position: 'topright' }).addTo(map);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && on) setFullscreen(false);
  });
}
