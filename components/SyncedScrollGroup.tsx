'use client';

import { Children, useEffect, useRef, useState } from 'react';

/**
 * Wraps a set of wide tables so exactly one horizontal scrollbar — fixed to the
 * bottom of the viewport — drives all of them in sync, regardless of vertical
 * scroll position. Each table's own overflow is clipped (not scrollable on its
 * own); the fixed track is the only scroll surface.
 */
export function SyncedScrollGroup({ children }: { children: React.ReactNode }) {
  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const [spacerWidth, setSpacerWidth] = useState(0);

  useEffect(() => {
    function recompute() {
      // The track spans the full viewport width, which is usually wider than any
      // individual table's own clientWidth (tables sit inside a padded, max-width
      // column). What the track needs to reproduce is each table's *overflow*
      // (scrollWidth - clientWidth) — not its raw scrollWidth — so that scrolling
      // the track fully maps 1:1 onto every table's own scrollLeft range.
      const overflows = containerRefs.current.filter(Boolean).map((el) => el!.scrollWidth - el!.clientWidth);
      const maxOverflow = overflows.length ? Math.max(...overflows, 0) : 0;
      const trackClientWidth = trackRef.current?.clientWidth ?? 0;
      setSpacerWidth(trackClientWidth + maxOverflow);
    }
    recompute();
    const ro = new ResizeObserver(recompute);
    containerRefs.current.forEach((el) => el && ro.observe(el));
    window.addEventListener('resize', recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recompute);
    };
  });

  function handleTrackScroll() {
    const left = trackRef.current?.scrollLeft ?? 0;
    containerRefs.current.forEach((el) => {
      if (el) el.scrollLeft = left;
    });
  }

  const items = Children.toArray(children);

  return (
    <>
      {items.map((child, i) => (
        <div
          key={i}
          ref={(el) => {
            containerRefs.current[i] = el;
          }}
          style={{ overflowX: 'hidden' }}
        >
          {child}
        </div>
      ))}
      <div className="synced-scroll-track no-print" ref={trackRef} onScroll={handleTrackScroll}>
        <div style={{ width: spacerWidth, height: 1 }} />
      </div>
    </>
  );
}
