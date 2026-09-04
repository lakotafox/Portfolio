/* The projects as a tap deck (PUDDL3 P4RTS tap-deck): a stacked card pile —
 * tap the pile to riffle to the next project, hit "Open" to visit it.
 *
 * This replaced the drifting TileStream wall: cards in constant motion were
 * genuinely hard to LOOK at, and hard to hit. A deck is stationary, one
 * project fills your attention at a time, and the same gesture works
 * identically on desktop and phone.
 *
 * tap-deck's items are ReactNodes, so each card carries the full project:
 * image, title, tag, description, and a real <a>. The link stops propagation
 * — otherwise opening a project would also riffle the deck under it.
 */
import { useEffect, useMemo, useState } from 'react';
import TapDeck from './puddl3/tap-deck/tap-deck';
import { useDice } from './dice/DiceProvider';
import './project-deck.css';

const isExternal = (href) => /^https?:\/\//i.test(href ?? '');
const linkProps = (href) =>
  isExternal(href)
    ? { href, target: '_blank', rel: 'noopener noreferrer' }
    : { href, target: '_self' };

/** deck sized from the viewport: phones get ~82vw, desktops cap at 380px */
function sizeFor(width) {
  const w = Math.min(380, Math.round(width * 0.82));
  return { w, h: Math.round(w * 1.35) };
}

function Card({ project }) {
  return (
    <div className="pdeck-card">
      <img className="pdeck-img" src={project.image} alt="" loading="lazy" draggable={false} />
      <div className="pdeck-body">
        <div className="pdeck-head">
          <h3 className="pdeck-title">{project.title}</h3>
          {project.tag && <span className="pdeck-tag">{project.tag}</span>}
        </div>
        <p className="pdeck-desc">{project.description}</p>
        <a
          className="pdeck-open"
          {...linkProps(project.link)}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          Open project
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </div>
  );
}

export default function ProjectDeck({ projects }) {
  const d = useDice();
  const [size, setSize] = useState(() =>
    sizeFor(typeof window === 'undefined' ? 1280 : window.innerWidth));
  useEffect(() => {
    const onResize = () => setSize(sizeFor(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const items = useMemo(
    () => projects.filter((p) => p.image).map((p) => <Card key={p.id} project={p} />),
    [projects],
  );

  return (
    /* tap-deck positions its cards absolutely and gives its container no
     * height of its own — unsized, the pile renders into a 0px strip. The
     * fan spreads down-left, so height = card + the spread of the visible
     * stack, width likewise. */
    <div
      className="project-deck"
      style={{ '--deck-w': `${size.w + 4 * 18}px`, '--deck-h': `${size.h + 4 * 16 + 8}px` }}
    >
      <TapDeck
        items={items}
        cardWidth={size.w}
        cardHeight={size.h}
        visibleCount={5}
        spreadX={18}
        spreadY={-16}
        borderRadius={16}
        duration={0.32}
        shadowBlur={26}
        shadowOpacity={0.35}
        cardColor="var(--p4-card, #16161c)"
      />
      <p className="pdeck-hint">tap the pile for the next project · {items.length} projects</p>
    </div>
  );
}
