// Geolocate on demand (never on load), list the ten closest visible trees.
import { goTo } from './map.js';

const L = window.L;

function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const fmtDist = (m) =>
  m < 1000 ? `${Math.round(m)} m` : `${(m / 1609.34).toFixed(1)} mi`;

export function initNearMe(map, filters, openTree) {
  const btn = document.getElementById('near-me-btn');
  const panel = document.getElementById('nearby-panel');
  const list = document.getElementById('nearby-list');
  let youMarker = null;

  document.getElementById('nearby-close').addEventListener('click', () => {
    panel.hidden = true;
  });

  btn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      btn.textContent = 'No location support';
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Locating…';
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        btn.disabled = false;
        btn.textContent = 'Near me';
        const { latitude: lat, longitude: lon } = coords;

        if (youMarker) youMarker.remove();
        youMarker = L.circleMarker([lat, lon], {
          radius: 7,
          color: '#26302b',
          weight: 2,
          fillColor: '#f7f6f1',
          fillOpacity: 1,
        })
          .addTo(map)
          .bindTooltip('You are here');

        const nearest = filters
          .visibleFeatures()
          .map((f) => ({
            f,
            d: haversineM(lat, lon, f.geometry.coordinates[1], f.geometry.coordinates[0]),
          }))
          .sort((a, b) => a.d - b.d)
          .slice(0, 10);

        list.innerHTML = '';
        for (const { f, d } of nearest) {
          const li = document.createElement('li');
          const b = document.createElement('button');
          b.innerHTML = `${f.properties.common}${
            f.properties.heritage_number ? ' ★' : ''
          } <span class="dist">${fmtDist(d)}</span>`;
          b.addEventListener('click', () => openTree(f));
          li.appendChild(b);
          list.appendChild(li);
        }
        panel.hidden = false;
        goTo(map, [lat, lon], 15);
      },
      () => {
        btn.disabled = false;
        btn.textContent = 'Location denied';
        setTimeout(() => (btn.textContent = 'Near me'), 2500);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  });
}
