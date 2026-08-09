// Title screen: pixel title + blinking START over a tree background.
// The backdrop holds a <video> slot (assets/title-bg.mp4, optional) with a
// tiled-pattern fallback; START whooshes the whole screen away into the
// map. Skipped on same-session reloads so a mid-walk refresh doesn't
// replay it.
import { REDUCED_MOTION } from './map.js';
import { menuOpen } from './sounds.js';

const KEY = 'ofm-started';

export function initTitle() {
  const screen = document.getElementById('title-screen');
  const video = document.getElementById('title-video');

  if (sessionStorage.getItem(KEY) === '1') {
    screen.remove();
    return;
  }

  // Only surface the video layer if the file actually exists (it lands
  // later than the code); the pattern fallback is always behind it.
  if (video) {
    video.addEventListener('canplay', () => video.classList.add('ready'), { once: true });
    video.addEventListener('error', () => video.remove(), { once: true });
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
