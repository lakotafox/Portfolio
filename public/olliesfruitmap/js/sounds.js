// Tiny sound layer: Gifsmith's click for buttons, the menu whoosh for the
// title screen. Sounds only ever fire from user gestures. Mute persists.
const KEY = 'ofm-muted';

let muted = localStorage.getItem(KEY) === '1';

function make(src, volume) {
  const a = new Audio(src);
  a.preload = 'auto';
  a.volume = volume;
  return a;
}

const clickA = make('sounds/clicks.mp3', 0.35);
const menuA = make('sounds/mainmenuopen.mp3', 0.5);

function play(a) {
  if (muted) return;
  try {
    a.currentTime = 0;
    a.play().catch(() => {});
  } catch {
    /* autoplay policies etc — sounds are decoration */
  }
}

export const click = () => play(clickA);
export const menuOpen = () => play(menuA);

export const isMuted = () => muted;
export function setMuted(next) {
  muted = next;
  localStorage.setItem(KEY, next ? '1' : '0');
}

export function initMuteButton(btn) {
  const render = () => {
    btn.textContent = muted ? '🔇' : '🔊';
    btn.setAttribute('aria-label', muted ? 'Unmute sounds' : 'Mute sounds');
    btn.setAttribute('aria-pressed', String(muted));
  };
  btn.addEventListener('click', () => {
    setMuted(!muted);
    render();
    click(); // confirms unmute audibly; no-op when muting
  });
  render();
}
