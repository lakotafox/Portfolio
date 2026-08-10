// The fruit on the map. Orchard stars load at boot (data/trees.geojson);
// the rest lazy-load from data/more/<key>.geojson on first toggle.
// Keep keys/colors in sync with scripts/fetch-fruit.mjs TAXA.
// icon: filename in icons/ (pixel art, scripts/generate_ofm_icons.py).
export const TAXA = {
  apple: { label: 'Apple', icon: 'apple', group: 'orchard', color: '#e03131', ripen: 'Aug–Oct' },
  fig: { label: 'Fig', icon: 'fig', group: 'orchard', color: '#7048e8', ripen: 'Aug–Oct' },
  plum: { label: 'Plum & cherry plum', icon: 'plum', group: 'more', color: '#9c36b5', ripen: 'Jul–Sep' },
  cherry: { label: 'Cherry', icon: 'cherry', group: 'more', color: '#c2255c', ripen: 'Jun–Jul' },
  pear: { label: 'Pear', icon: 'pear', group: 'more', color: '#66a80f', ripen: 'Aug–Oct' },
  stonefruit: { label: 'Peach & apricot', icon: 'peach', group: 'more', color: '#ff922b', ripen: 'Jul–Sep' },
  rare: { label: 'Persimmon & rare finds', icon: 'persimmon', group: 'more', color: '#d9480f', ripen: 'Sep–Nov' },
  nuts: { label: 'Walnut & nuts', icon: 'walnut', group: 'more', color: '#846358', ripen: 'Sep–Nov' },
  berry: { label: 'Mulberry & serviceberry', icon: 'berry', group: 'more', color: '#364fc7', ripen: 'Jun–Aug' },
};

// Emoji are banned app-wide — every little glyph is one of these <img>s.
export const pxIcon = (name, size = 15) =>
  `<img class="px-icon" src="icons/${name}.png" alt="" width="${size}" height="${size}">`;

export const BOOT_KEYS = Object.keys(TAXA).filter((k) => TAXA[k].group === 'orchard');
export const MORE_KEYS = Object.keys(TAXA).filter((k) => TAXA[k].group === 'more');
