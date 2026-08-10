// Marker factory + popup HTML. Heritage trees get a bigger, ringed marker.
import { ageInfo, predatesOrchardEra, ORCHARD_ERA_YEAR } from './age.js';
import { TAXA } from './taxa.js';

const L = window.L;

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function popupHtml(p, lat, lon) {
  const t = TAXA[p.taxon];
  const rows = [];
  if (t.ripen) rows.push(['ripens', t.ripen]);
  if (p.height_ft) rows.push(['height', `${p.height_ft} ft`]);
  const age = ageInfo(p);
  if (age?.documented) rows.push(['planted', `${age.planted} — ${age.years} yrs old`]);
  else if (age) rows.push(['age', `~${age.years} yrs (est.)`]);
  if (p.condition) rows.push(['condition', esc(p.condition)]);
  if (p.year_designated) rows.push(['designated', p.year_designated]);
  const src = { heritage: 'heritage registry', street: 'street inventory', parks: 'parks inventory' }[p.source];
  rows.push(['source', p.recorded ? `${src} · ${p.recorded}` : src]);

  return `
    <div class="popup">
      <div class="popup-titlebar w95-titlebar"><span>${t.emoji} ${esc(p.common)}</span></div>
      ${p.heritage_number ? `<span class="heritage-badge">★ Heritage tree #${p.heritage_number}</span>` : ''}
      ${p.heritage_status === 'Merit' ? '<span class="heritage-badge">Tree of merit</span>' : ''}
      ${predatesOrchardEra(age) ? `<span class="heritage-badge age-badge">Old orchard survivor (pre-${ORCHARD_ERA_YEAR} est.)</span>` : ''}
      <p class="sci">${esc(p.scientific)}</p>
      <div class="data-rows">
        ${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
      </div>
      ${p.address ? `<p class="addr">${esc(p.address)}</p>` : ''}
      ${p.notes ? `<p class="note">${esc(p.notes)}</p>` : ''}
      <div class="dir-links">
        <a class="w95-btn dir-btn" href="https://maps.apple.com/?daddr=${lat},${lon}&dirflg=w" target="_blank" rel="noopener noreferrer">🧭 Apple Maps</a>
        <a class="w95-btn dir-btn" href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=walking" target="_blank" rel="noopener noreferrer">🗺️ Google Maps</a>
      </div>
      ${p.portlandwild_url ? `<a class="wild-link w95-btn" href="${esc(p.portlandwild_url)}" target="_blank" rel="noopener noreferrer">More on Portland Wild →</a>` : ''}
    </div>`;
}

export function makeMarker(feature) {
  const p = feature.properties;
  const [lon, lat] = feature.geometry.coordinates;
  const heritage = p.source === 'heritage';
  const marker = L.circleMarker([lat, lon], {
    radius: heritage ? 9 : 6,
    color: heritage ? '#000080' : TAXA[p.taxon].color,
    weight: heritage ? 2.5 : 1.5,
    fillColor: TAXA[p.taxon].color,
    fillOpacity: 0.85,
    className: heritage ? 'heritage-ring' : 'tree-marker',
  });
  marker.bindPopup(popupHtml(p, lat, lon), { maxWidth: 300 });
  return marker;
}
