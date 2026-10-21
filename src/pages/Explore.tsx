import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GridSkeleton, Poster, Status } from '../components/Rows';
import { FEEDS, tmdb } from '../lib/tmdb';
import { mediaKey } from '../lib/types';
import type { Media } from '../lib/types';

/** Full list for a home-page row: /explore/:feed (Movies and TV Shows tabs use popular-movie / popular-tv). */
export default function Explore({ feed: fixed }: { feed?: string }) {
  const params = useParams();
  const feed = fixed ?? params.feed ?? '';
  const def = FEEDS[feed];
  const [items, setItems] = useState<Media[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems([]);
    setPage(1);
    setPages(1);
    setError(null);
  }, [feed]);

  useEffect(() => {
    if (!def) return;
    let live = true;
    setBusy(true);
    tmdb
      .feed(feed, page)
      .then((r) => {
        if (!live) return;
        setItems((cur) => {
          const seen = new Set(cur.map(mediaKey));
          return [...cur, ...r.items.filter((m) => !seen.has(mediaKey(m)))];
        });
        setPages(r.pages);
        setBusy(false);
      })
      .catch((e: Error) => {
        if (!live) return;
        setError(e.message);
        setBusy(false);
      });
    return () => {
      live = false;
    };
  }, [feed, page, def]);

  if (!def) return <main className="page pad-top"><Status kind="empty" text="That list doesn't exist." /></main>;

  const isMovies = feed === 'popular-movie';
  const isTv = feed === 'popular-tv';

  return (
    <main className="page pad-top">
      <div className="container">
        <div className="page-head">
          <div>
            <h1 className="title">{isMovies ? 'Movies' : isTv ? 'TV Shows' : def.title}</h1>
            <p className="muted">{isMovies || isTv ? 'Popular right now' : 'Explore everything in this list'}</p>
          </div>
          {(isMovies || isTv) && <Link to="/genres" className="btn small ghost">Browse genres</Link>}
        </div>
        {error && items.length === 0 ? (
          <Status kind="error" text={error} retry={() => { setError(null); setPage(1); }} />
        ) : items.length === 0 && busy ? (
          <GridSkeleton />
        ) : (
          <>
            <div className="grid">{items.map((m) => <Poster key={mediaKey(m)} m={m} />)}</div>
            {page < pages && (
              <div className="center">
                <button className="btn" disabled={busy} onClick={() => setPage((p) => p + 1)}>{busy ? 'Loading…' : 'Load more'}</button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
