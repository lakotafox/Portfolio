// Marker factory + popup HTML. Heritage trees get a bigger, ringed marker.
import { trunkFigure } from './trunk.js';
import { ageInfo, predatesSettlement, PRE_SETTLEMENT_YEAR } from './age.js';
import { TAXA } from './taxa.js';

const L = window.L;

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function popupHtml(p) {
  const rows = [];
  if (p.dbh_in) rows.push(['diameter', `${p.dbh_in}"`]);
  if (p.height_ft) rows.push(['height', `${p.height_ft} ft`]);
  const age = ageInfo(p);
  if (age?.documented) rows.push(['planted', `${age.planted} — ${age.years} yrs old`]);
  else if (age) rows.push(['age', `~${age.years} yrs (est.)`]);
  if (p.condition) rows.push(['condition', esc(p.condition)]);
  if (p.year_designated) rows.push(['designated', p.year_designated]);
  rows.push(['source', { heritage: 'heritage registry', street: 'street inventory', parks: 'parks inventory' }[p.source]]);

  return `
    <div class="popup">
      ${p.heritage_number ? `<span class="heritage-badge">Heritage tree #${p.heritage_number}</span>` : ''}
      ${p.heritage_status === 'Merit' ? '<span class="heritage-badge">Tree of merit</span>' : ''}
      ${predatesSettlement(age) ? `<span class="heritage-badge age-badge">Likely predates ${PRE_SETTLEMENT_YEAR}</span>` : ''}
      <h3>${esc(p.common)}</h3>
      <p class="sci">${esc(p.scientific)}</p>
      <div class="data-rows">
        ${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
      </div>
      ${p.address ? `<p class="addr">${esc(p.address)}</p>` : ''}
      ${p.notes ? `<p class="note">${esc(p.notes)}</p>` : ''}
      ${p.portlandwild_url ? `<a class="wild-link" href="${esc(p.portlandwild_url)}" target="_blank" rel="noopener noreferrer">More on Portland Wild →</a>` : ''}
      ${trunkFigure(p.dbh_in)}
    </div>`;
}

export function makeMarker(feature) {
  const p = feature.properties;
  const [lon, lat] = feature.geometry.coordinates;
  const heritage = p.source === 'heritage';
  const marker = L.circleMarker([lat, lon], {
    radius: heritage ? 9 : 6,
    color: heritage ? '#26302b' : TAXA[p.taxon].color,
    weight: heritage ? 2.5 : 1.5,
    fillColor: TAXA[p.taxon].color,
    fillOpacity: 0.85,
    className: heritage ? 'heritage-ring' : 'tree-marker',
  });
  marker.bindPopup(popupHtml(p), { maxWidth: 300 });
  return marker;
}
