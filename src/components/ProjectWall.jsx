/* The projects, shown as a drifting perspective wall (PUDDL3 P4RTS TileStream).
 *
 * TileStream only carries image + title + href, so the descriptions, tags and
 * the project modal are NOT reachable from the wall. The detail list is still
 * rendered underneath for anyone who wants to read rather than browse — and so
 * the page keeps its real, indexable project text.
 *
 * The wall is decorative-but-navigable: every tile is a real <a>, so keyboard
 * and crawlers get the same links.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TileStream from './puddl3/tile-stream/TileStream';
import { useDice } from './dice/DiceProvider';
import './project-wall.css';

const GAP = 18;
const TILE_RATIO = 150 / 230; // keep the original card proportions

/* How the wall is sized.
 *
 * The brief: 3 columns across on mobile, 4 on desktop, each spanning the full
 * width of the screen — so tiles get bigger, not more numerous. Tile width is
 * therefore derived from the viewport (width / visible columns), never fixed.
 *
 * A few extra columns are rendered beyond the visible count so the plane's real
 * left/right edge always sits off-screen — the wall is yawed -12° and scaled
 * 1.18, so without the buffer you can catch its edge on a wide monitor. */
const BLEED_COLUMNS = 3;

function layoutFor(width) {
  const visible = width < 900 ? 3 : 4;
  const tileWidth = Math.max(120, Math.round(width / visible) - GAP);
  return {
    visible,
    columns: visible + BLEED_COLUMNS,
    tileWidth,
    tileHeight: Math.round(tileWidth * TILE_RATIO),
  };
}

/* How many tiles each column holds before it repeats. Tall enough that a
 * column's loop point stays well off-screen, so you never catch the same card
 * twice in one column. */
const PER_COLUMN = 8;

/* TileStream deals items round-robin: items[i] goes to column i % columns, so
 * with more columns than projects each column ends up with one or two and
 * loops immediately — the same project stacked over and over.
 *
 * So we build the flat array ourselves, laid out so that when TileStream deals
 * it back out, column c receives PER_COLUMN *distinct* projects starting from
 * its own offset. STEP is coprime with most project counts, which keeps
 * neighbouring columns from syncing up. */
function dealColumns(projects, columns) {
  const n = projects.length;
  if (!n) return [];
  /* Space each column's starting offset evenly around the project list. A
   * fixed step wraps and collides — with 22 projects over 7 columns, step 7
   * gave offsets 0,7,14,21,6,13,20, and the 21→0 wrap put the same projects
   * back on screen side by side (only 14 of 22 distinct visible). Deriving it
   * from n/columns spreads the offsets so nearly every project is on screen
   * at once. */
  const STEP = Math.max(1, Math.round(n / columns));
  const flat = new Array(columns * PER_COLUMN);
  /* TileStream labels every tile data-tile-id="<col>-<copy>-<itemIndex>", so
   * this map lets a hovered/tapped tile be traced straight back to its project
   * — no re-deriving the modular arithmetic at event time. */
  const lookup = new Map();
  for (let c = 0; c < columns; c++) {
    for (let k = 0; k < PER_COLUMN; k++) {
      const project = projects[(c * STEP + k) % n];
      flat[c + k * columns] = project;
      lookup.set(`${c}:${k}`, project);
    }
  }
  return { items: flat, lookup };
}


/* A project link is either an internal app path ("/gifsmith/") or an external
 * site ("https://foxbuiltstore.com"). External ones open in a new tab with
 * noopener; internal ones navigate in place — matching exactly what the old
 * project cards did, so no link behaviour changed when the grid was replaced. */
const isExternal = (href) => /^https?:\/\//i.test(href ?? '');
const linkProps = (href) =>
  isExternal(href)
    ? { href, target: '_blank', rel: 'noopener noreferrer' }
    : { href, target: '_self' };

function openProject(project) {
  if (!project?.link) return;
  if (isExternal(project.link)) window.open(project.link, '_blank', 'noopener,noreferrer');
  else window.location.href = project.link;
}

/** Touch devices report no hover; only those get the tap-to-open-a-panel flow. */
function useHasHover() {
  const [can, setCan] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const read = () => setCan(mq.matches);
    read();
    mq.addEventListener('change', read);
    return () => mq.removeEventListener('change', read);
  }, []);
  return can;
}

/** Desktop: a card that follows the pointer, clamped inside the wall. */
function HoverCard({ project, x, y }) {
  const CARD_W = 320;
  /* The wall clips its own overflow, so a card sitting above the pointer near
   * the top edge lost its title and tag. Flip it below the pointer there. */
  const CARD_H = 168;
  const below = y < CARD_H + 24;
  return (
    <div
      className={`project-wall__hover${below ? ' is-below' : ''}`}
      style={{
        // keep it inside the wall horizontally too, near either edge
        left: `clamp(12px, ${x - CARD_W / 2}px, calc(100% - ${CARD_W + 12}px))`,
        top: y,
        width: CARD_W,
      }}
      aria-hidden="true"
    >
      <div className="project-wall__hover-head">
        <h3>{project.title}</h3>
        {project.tag && <span className="project-wall__tag">{project.tag}</span>}
      </div>
      <p>{project.description}</p>
      <span className="project-wall__cue">Click to open →</span>
    </div>
  );
}

/** Touch: a sheet with the full text and an explicit link button. */
function TapSheet({ project, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="project-wall__sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="project-wall__sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={project.title}
      >
        <button type="button" className="project-wall__close" onClick={onClose} aria-label="Close">&times;</button>
        <img src={project.image} alt="" className="project-wall__sheet-img" />
        <div className="project-wall__sheet-body">
          <div className="project-wall__hover-head">
            <h3>{project.title}</h3>
            {project.tag && <span className="project-wall__tag">{project.tag}</span>}
          </div>
          <p>{project.description}</p>
          <a className="project-wall__open" {...linkProps(project.link)}>
            Open project
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ProjectWall({ projects }) {
  const d = useDice();
  const wrapRef = useRef(null);

  const withImages = useMemo(
    () => projects.filter((p) => p.image),
    [projects],
  );

  const density = d?.look?.density ?? 'balanced';
  const speed = density === 'calm' ? 18 : density === 'loud' ? 58 : 34;

  // Recompute on resize so the wall keeps running off both edges at any width.
  const [layout, setLayout] = useState(() =>
    layoutFor(typeof window === 'undefined' ? 1440 : window.innerWidth));
  useEffect(() => {
    const onResize = () => setLayout(layoutFor(window.innerWidth));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* Tiles are handed to TileStream WITHOUT href on purpose. With one it renders
   * an <a> and any tap navigates immediately — which would make it impossible
   * to show the project's details on touch. Navigation is done from the panel's
   * own link instead, so every project link still resolves exactly as before. */
  const { items, lookup } = useMemo(
    () => dealColumns(withImages.map((p) => ({ image: p.image, title: p.title })), layout.columns),
    [withImages, layout.columns],
  );
  const projectAt = useCallback(
    (tileId) => {
      if (!tileId) return null;
      const [col, , itemIndex] = tileId.split('-');
      const stub = lookup.get(`${col}:${itemIndex}`);
      return stub ? withImages.find((p) => p.title === stub.title) ?? null : null;
    },
    [lookup, withImages],
  );

  // Desktop hovers to preview; touch taps to open a panel it must dismiss.
  const [hovered, setHovered] = useState(null);   // { project, x, y }
  const [pinned, setPinned] = useState(null);     // project, touch/tap only
  const canHover = useHasHover();

  const onPointerMove = useCallback((e) => {
    if (!canHover || pinned) return;
    const tile = e.target.closest?.('[data-tile-id]');
    if (!tile) { setHovered(null); return; }
    const project = projectAt(tile.dataset.tileId);
    if (!project) { setHovered(null); return; }
    const wrap = wrapRef.current?.getBoundingClientRect();
    setHovered({ project, x: e.clientX - (wrap?.left ?? 0), y: e.clientY - (wrap?.top ?? 0) });
  }, [canHover, pinned, projectAt]);

  const onClick = useCallback((e) => {
    const tile = e.target.closest?.('[data-tile-id]');
    if (!tile) return;
    const project = projectAt(tile.dataset.tileId);
    if (!project) return;
    e.preventDefault();
    // On a pointer device a click means "go"; on touch it means "tell me more".
    if (canHover) openProject(project);
    else setPinned(project);
  }, [canHover, projectAt]);

  // Keyboard: focusing a tile previews it, Enter/Space opens it.
  const onFocus = useCallback((e) => {
    const tile = e.target.closest?.('[data-tile-id]');
    const project = tile && projectAt(tile.dataset.tileId);
    if (!project) return;
    const wrap = wrapRef.current?.getBoundingClientRect();
    const r = tile.getBoundingClientRect();
    setHovered({ project, x: r.left + r.width / 2 - (wrap?.left ?? 0), y: r.top - (wrap?.top ?? 0) });
  }, [projectAt]);

  const onKeyDown = useCallback((e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const tile = e.target.closest?.('[data-tile-id]');
    const project = tile && projectAt(tile.dataset.tileId);
    if (!project) return;
    e.preventDefault();
    openProject(project);
  }, [projectAt]);

  return (
    <div
      ref={wrapRef}
      className="project-wall"
      onPointerMove={onPointerMove}
      onPointerLeave={() => setHovered(null)}
      onClick={onClick}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
    >
      <TileStream
        items={items}
        columns={layout.columns}
        tileWidth={layout.tileWidth}
        tileHeight={layout.tileHeight}
        gap={GAP}
        radius={12}
        tilt={14}
        turn={-12}
        perspective={1250}
        depth={110}
        speed={speed}
        direction="up"
        variance={0.45}
        parallax={0.55}
        lift={70}
        /* These three all dim the tiles and stack multiplicatively — the
         * defaults are tuned for a decorative backdrop, but these are the
         * actual project cards, so they need to read clearly at rest. */
        fade={0.28}
        dim={0.94}
        overlayColor="transparent"
      />

      {canHover && hovered && !pinned && (
        <HoverCard project={hovered.project} x={hovered.x} y={hovered.y} />
      )}

      {pinned && <TapSheet project={pinned} onClose={() => setPinned(null)} />}
    </div>
  );
}
