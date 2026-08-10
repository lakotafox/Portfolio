// Geolocate on demand (never on load) and fly the map to you — the
// trees around you speak for themselves.
import { goTo } from './map.js';
import { click } from './sounds.js';

const L = window.L;

export function initNearMe(map) {
  const btn = document.getElementById('near-me-btn');
  let youMarker = null;

  btn.addEventListener('click', () => {
    click();
    if (!navigator.geolocation) {
      btn.textContent = 'No location support';
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Locating…';
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        btn.disabled = false;
        btn.innerHTML = '📍 Near me';
        const { latitude: lat, longitude: lon } = coords;

        if (youMarker) youMarker.remove();
        youMarker = L.circleMarker([lat, lon], {
          radius: 8,
          color: '#000080',
          weight: 3,
          fillColor: '#ffff00',
          fillOpacity: 1,
        })
          .addTo(map)
          .bindTooltip('You are here');

        goTo(map, [lat, lon], 17);
        document.dispatchEvent(new CustomEvent('ofm:nearme-shown'));
      },
      () => {
        btn.disabled = false;
        btn.textContent = 'Location denied';
        document.dispatchEvent(new CustomEvent('ofm:nearme-denied'));
        setTimeout(() => (btn.innerHTML = '📍 Near me'), 2500);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  });
}
