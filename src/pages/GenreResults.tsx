import Icon from '../components/Icon';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Grid, GridSkeleton, Status } from '../components/Rows';
import { findGenre } from '../lib/genres';
import { tmdb } from '../lib/tmdb';
import { mediaKey } from '../lib/types';
import type { Media, MediaType } from '../lib/types';

export default function GenreResults() {
  const { type, id } = useParams();
  const t: MediaType = type === 'tv' ? 'tv' : 'movie';
  const gid = Number(id);
  const genre = findGenre(t, gid);

  const [items, setItems] = useState<Media[]>([]);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (p: number) => {
      setLoading(true);
      setError(null);
      tmdb
        .discover(t, gid, p)
        .then((r) => {
          setItems((cur) => {
            const seen = new Set(cur.map(mediaKey));
            return p === 1 ? r.items : [...cur, ...r.items.filter((m) => !seen.has(mediaKey(m)))];
          });
          setPage(p);
          setPages(Math.min(r.pages, 500));
        })
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false));
    },
    [t, gid]
  );

  useEffect(() => {
    setItems([]);
    setPage(0);
    load(1);
  }, [load]);

  return (
    <main className="page pad-top">
      <div className="container">
        <p className="crumb"><Link to="/genres" className="link"><Icon name="chevronLeft" size={14} />All genres</Link></p>
        <h1 className="title">{genre?.name ?? 'Genre'} <span className="accent">{t === 'tv' ? 'Shows' : 'Movies'}</span></h1>
        {error ? (
          <Status kind="error" text={error} retry={() => load(page + 1)} />
        ) : items.length === 0 && loading ? (
          <GridSkeleton />
        ) : (
          <>
            <Grid items={items} />
            {page < pages && (
              <div className="center-row">
                <button className="btn" disabled={loading} onClick={() => load(page + 1)}>{loading ? 'Loading…' : 'Load more'}</button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
