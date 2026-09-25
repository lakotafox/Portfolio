// Map / Satellite / Hybrid switcher — a Win95 button strip in the map's
// top-right, under the fullscreen button. Choice persists (map.js).
import { setBasemap } from './map.js';

const OPTIONS = [
  ['map', 'Map'],
  ['satellite', 'Satellite'],
  ['hybrid', 'Hybrid'],
];

export function initBasemapControl(map) {
  const L = window.L;
  const buttons = {};
  const render = (name) => {
    for (const [k, btn] of Object.entries(buttons)) {
      btn.setAttribute('aria-pressed', String(k === name));
    }
  };

  const Control = L.Control.extend({
    onAdd() {
      const wrap = L.DomUtil.create('div', 'leaflet-bar basemap-ctl');
      wrap.setAttribute('role', 'group');
      wrap.setAttribute('aria-label', 'Map style');
      for (const [name, label] of OPTIONS) {
        const btn = L.DomUtil.create('button', 'w95-btn basemap-btn', wrap);
        btn.type = 'button';
        btn.textContent = label;
        buttons[name] = btn;
        L.DomEvent.on(btn, 'click', () => render(setBasemap(map, name)));
      }
      L.DomEvent.disableClickPropagation(wrap);
      L.DomEvent.disableScrollPropagation(wrap);
      render(localStorage.getItem('ofm-basemap') || 'map');
      return wrap;
    },
  });
  new Control({ position: 'topright' }).addTo(map);
}
