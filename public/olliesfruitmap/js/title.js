// Title screen: pixel title + blinking START over the orchard artwork
// (assets/title-bg.jpg, tiled-pattern fallback underneath), plus the
// add-to-home-screen helper. START whooshes the whole screen away into
// the map. Skipped on same-session reloads so a mid-walk refresh doesn't
// replay it.
import { REDUCED_MOTION } from './map.js';
import { menuOpen } from './sounds.js';

const KEY = 'ofm-started';

export function initTitle() {
  const screen = document.getElementById('title-screen');

  if (sessionStorage.getItem(KEY) === '1') {
    screen.remove();
    return;
  }

  // Add-to-home-screen helper: no tip when already running as an app.
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (standalone) {
    document.getElementById('a2hs-tip').remove();
  } else {
    const overlay = document.getElementById('a2hs-overlay');
    document.getElementById('a2hs-open').addEventListener('click', () => {
      overlay.hidden = false;
    });
    document.getElementById('a2hs-close').addEventListener('click', () => {
      overlay.hidden = true;
    });
  }

  document.getElementById('start-btn').addEventListener('click', () => {
    sessionStorage.setItem(KEY, '1');
    menuOpen();
    if (REDUCED_MOTION) {
      screen.remove();
      return;
    }
    screen.classList.add('leaving');
    screen.addEventListener('animationend', () => screen.remove(), { once: true });
    // Safety net: remove even if animation events never fire.
    setTimeout(() => screen.remove(), 1600);
  });
}
