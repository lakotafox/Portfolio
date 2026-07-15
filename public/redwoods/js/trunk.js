// Signature element: the tree's actual trunk diameter drawn to scale next
// to a human silhouette. Real data, one glance, no other tree map does it.
const HUMAN_HEIGHT_IN = 69; // 5'9"
const FIG_HEIGHT_PX = 72;
const PX_PER_IN = FIG_HEIGHT_PX / HUMAN_HEIGHT_IN;
const MAX_WIDTH_PX = 240;

export function trunkFigure(dbhIn) {
  if (!dbhIn) return '';
  const trunkPx = Math.min(dbhIn * PX_PER_IN, MAX_WIDTH_PX);
  const humanX = trunkPx + 14;
  const width = Math.ceil(humanX + 16);
  const feet = Math.floor(dbhIn / 12);
  const inches = Math.round(dbhIn % 12);
  const label = feet ? `${feet}'${inches}"` : `${inches}"`;
  // Trunk cross-section as a to-scale circle segment (capped at popup width),
  // human silhouette at the same scale for reference.
  return `
    <figure class="trunk-fig">
      <svg width="${width}" height="${FIG_HEIGHT_PX}" viewBox="0 0 ${width} ${FIG_HEIGHT_PX}" role="img"
           aria-label="Trunk ${label} across, next to a 5 foot 9 person for scale">
        <rect x="0" y="${FIG_HEIGHT_PX - Math.min(trunkPx, FIG_HEIGHT_PX)}" width="${trunkPx}"
              height="${Math.min(trunkPx, FIG_HEIGHT_PX)}" rx="${Math.min(trunkPx, FIG_HEIGHT_PX) / 2.2}"
              fill="#9c4a26" opacity="0.85"/>
        <g fill="#26302b">
          <circle cx="${humanX}" cy="8" r="5"/>
          <rect x="${humanX - 3.5}" y="14" width="7" height="26" rx="3"/>
          <rect x="${humanX - 3}" y="40" width="2.6" height="30" rx="1.3"/>
          <rect x="${humanX + 0.4}" y="40" width="2.6" height="30" rx="1.3"/>
        </g>
      </svg>
      <figcaption class="trunk-caption">trunk ${label} across · person 5'9" for scale</figcaption>
    </figure>`;
}
