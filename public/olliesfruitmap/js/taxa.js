// The fruit on the map. Orchard stars load at boot (data/trees.geojson);
// the rest lazy-load from data/more/<key>.geojson on first toggle.
// Keep keys/colors in sync with scripts/fetch-fruit.mjs TAXA.
export const TAXA = {
  apple: { label: 'Apple', emoji: '🍎', group: 'orchard', color: '#e03131', ripen: 'Aug–Oct' },
  fig: { label: 'Fig', emoji: '🫐', group: 'orchard', color: '#7048e8', ripen: 'Aug–Oct' },
  plum: { label: 'Plum & cherry plum', emoji: '🍇', group: 'more', color: '#9c36b5', ripen: 'Jul–Sep' },
  cherry: { label: 'Cherry', emoji: '🍒', group: 'more', color: '#c2255c', ripen: 'Jun–Jul' },
  pear: { label: 'Pear', emoji: '🍐', group: 'more', color: '#66a80f', ripen: 'Aug–Oct' },
  stonefruit: { label: 'Peach & apricot', emoji: '🍑', group: 'more', color: '#ff922b', ripen: 'Jul–Sep' },
  rare: { label: 'Persimmon & rare finds', emoji: '🍊', group: 'more', color: '#d9480f', ripen: 'Sep–Nov' },
  nuts: { label: 'Walnut & nuts', emoji: '🌰', group: 'more', color: '#846358', ripen: 'Sep–Nov' },
  berry: { label: 'Mulberry & serviceberry', emoji: '🍓', group: 'more', color: '#364fc7', ripen: 'Jun–Aug' },
};

export const BOOT_KEYS = Object.keys(TAXA).filter((k) => TAXA[k].group === 'orchard');
export const MORE_KEYS = Object.keys(TAXA).filter((k) => TAXA[k].group === 'more');
