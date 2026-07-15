// Tree age: no dataset records it, so we do what urban foresters do —
// estimate from trunk diameter with a species growth rate (years per inch
// of DBH), calibrated against the Portland heritage trees whose planting
// dates are documented (dawn redwood #254, planted 1948 at 42" DBH; the
// city's 1880s-era giant sequoias at ~1"/year). Estimates only; a
// documented planting year in the record always wins.
const YEARS_PER_INCH = {
  sequoiadendron: 1.0,
  sequoia: 1.2,
  metasequoia: 1.5,
  pseudotsuga: 2.0,
  thuja: 2.5,
  quercus: 4.0, // white oak grows slowly — a 45" trunk is ~180 years
  acer: 1.5,
  pinus: 2.5,
};

// Portland was founded in 1845; trees at least this old were here first.
export const PRE_SETTLEMENT_YEAR = 1845;

export function predatesSettlement(info) {
  if (!info) return false;
  if (info.documented) return info.planted < PRE_SETTLEMENT_YEAR;
  return info.years >= new Date().getFullYear() - PRE_SETTLEMENT_YEAR;
}

export function ageInfo(p) {
  if (p.planted) {
    return { planted: p.planted, years: new Date().getFullYear() - p.planted, documented: true };
  }
  if (!p.dbh_in) return null;
  const years = Math.max(10, Math.round((p.dbh_in * YEARS_PER_INCH[p.taxon]) / 5) * 5);
  return { years, documented: false };
}
