// Tree age: no dataset records it, so estimate from trunk diameter with a
// species growth rate (years per inch of DBH). Fruit trees are faster
// growers than the conifers on the redwoods map; rates below are rough
// urban-orchard numbers. Estimates only; a documented planting year in a
// heritage record always wins.
const YEARS_PER_INCH = {
  apple: 2.2,
  fig: 1.2, // figs bulk up fast in Portland
  plum: 1.5,
  cherry: 1.5,
  pear: 2.5, // pears live long and grow slow — some Portland pears are pioneers
  stonefruit: 1.5,
  rare: 2.5,
  nuts: 2.0,
  berry: 2.0,
};

// A fruit tree whose estimate reaches back past 1900 is likely a survivor
// of the orchards that predate the neighborhoods around it.
export const ORCHARD_ERA_YEAR = 1900;

export function predatesOrchardEra(info) {
  if (!info) return false;
  if (info.documented) return info.planted < ORCHARD_ERA_YEAR;
  return info.years >= new Date().getFullYear() - ORCHARD_ERA_YEAR;
}

export function ageInfo(p) {
  if (p.planted) {
    return { planted: p.planted, years: new Date().getFullYear() - p.planted, documented: true };
  }
  if (!p.dbh_in) return null;
  const years = Math.max(5, Math.round((p.dbh_in * YEARS_PER_INCH[p.taxon]) / 5) * 5);
  return { years, documented: false };
}
