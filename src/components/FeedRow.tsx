import { useEffect, useRef, useState } from 'react';
import { FEEDS, tmdb } from '../lib/tmdb';
import type { Media } from '../lib/types';
import { PosterRow } from './Rows';

/** A home-page row that only loads once it is close to the screen. */
export default function FeedRow({ feed }: { feed: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [items, setItems] = useState<Media[]>([]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (e) => {
        if (e.some((x) => x.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '600px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    let live = true;
    tmdb.feed(feed).then((r) => live && setItems(r.items)).catch(() => undefined);
    return () => {
      live = false;
    };
  }, [near, feed]);

  return (
    <div ref={host} style={items.length ? undefined : { minHeight: near ? 40 : 360 }}>
      <PosterRow title={FEEDS[feed].title} items={items} to={`/explore/${feed}`} />
    </div>
  );
}
