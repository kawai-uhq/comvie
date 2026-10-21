import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GridSkeleton, Poster, Status } from '../components/Rows';
import { genresFor } from '../lib/genres';
import { FEEDS, tmdb } from '../lib/tmdb';
import { mediaKey } from '../lib/types';
import type { Media, MediaType } from '../lib/types';

const TABS: Record<MediaType, { feed: string; label: string }[]> = {
  movie: [
    { feed: 'popular-movie', label: 'Popular' },
    { feed: 'trending-movie', label: 'Trending Today' },
    { feed: 'top-movie', label: 'Top Rated' },
    { feed: 'upcoming', label: 'Upcoming' },
    { feed: 'now-playing', label: 'Now Playing' }
  ],
  tv: [
    { feed: 'popular-tv', label: 'Popular' },
    { feed: 'trending-tv', label: 'Trending Today' },
    { feed: 'top-tv', label: 'Top Rated' },
    { feed: 'on-air', label: 'Currently Airing' },
    { feed: 'airing-today', label: 'Airing Today' }
  ]
};

type Sort = 'pop' | 'rated' | 'new';
const today = () => new Date().toISOString().slice(0, 10);

/** The Movies and TV Shows pages (with tabs, genre and sort), or a plain full list for /explore/:feed. */
export default function Explore({ kind }: { kind?: MediaType }) {
  const params = useParams();
  const [tab, setTab] = useState(kind ? TABS[kind][0].feed : params.feed ?? '');
  const [genre, setGenre] = useState('');
  const [sort, setSort] = useState<Sort>('pop');

  // /explore/:feed changes with the address
  useEffect(() => {
    if (!kind) setTab(params.feed ?? '');
  }, [kind, params.feed]);

  const custom = !!kind && (genre !== '' || sort !== 'pop');
  const def = FEEDS[tab];

  const { path, type } = useMemo(() => {
    if (kind && custom) {
      const k = kind;
      const order =
        sort === 'rated'
          ? 'vote_average.desc&vote_count.gte=300'
          : sort === 'new'
            ? k === 'movie'
              ? `primary_release_date.desc&primary_release_date.lte=${today()}&vote_count.gte=20`
              : `first_air_date.desc&first_air_date.lte=${today()}&vote_count.gte=10`
            : 'popularity.desc';
      return { path: `/discover/${k}?sort_by=${order}${genre ? `&with_genres=${genre}` : ''}`, type: k as 'all' | MediaType };
    }
    return { path: def?.path ?? '', type: (def?.type ?? 'all') as 'all' | MediaType };
  }, [kind, custom, sort, genre, def]);

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
  }, [path]);

  useEffect(() => {
    if (!path) return;
    let live = true;
    setBusy(true);
    tmdb
      .list(path, type, page)
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
  }, [path, type, page]);

  if (!kind && !def) return <main className="page pad-top"><Status kind="empty" text="That list doesn't exist." /></main>;

  const word = kind === 'movie' ? 'Movies' : kind === 'tv' ? 'TV Series' : '';
  const lead = kind === 'movie' ? 'Explore' : 'Discover';
  const sub =
    kind === 'movie'
      ? 'Discover blockbusters, top rated classics, upcoming releases, and hidden gems.'
      : kind === 'tv'
        ? 'Binge-worthy shows, critically acclaimed series, and live airing episodes.'
        : 'Explore everything in this list.';

  return (
    <main className="page pad-top">
      <div className="container mid">
        <div className="page-head">
          <div>
            <h1 className="title">
              {kind ? (
                <>{lead} <span className="accent">{word}</span></>
              ) : (
                <span className="accent">{def.title}</span>
              )}
            </h1>
            <p className="muted">{sub}</p>
          </div>
          {kind && (
            <div className="head-tools">
              <select className="field select dd" value={genre} onChange={(e) => setGenre(e.target.value)} aria-label="Genre">
                <option value="">{kind === 'tv' ? 'All TV Genres' : 'All Genres'}</option>
                {genresFor(kind).map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <select className="field select dd" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort by">
                <option value="pop">Most Popular</option>
                <option value="rated">Top Rated</option>
                <option value="new">Newest</option>
              </select>
            </div>
          )}
        </div>

        {kind && (
          <div className="pills" style={{ justifyContent: 'flex-start' }} role="tablist" aria-label="Lists">
            {TABS[kind].map((t) => (
              <button
                key={t.feed}
                role="tab"
                aria-selected={!custom && tab === t.feed}
                className={`pill ${!custom && tab === t.feed ? 'on' : ''}`}
                onClick={() => {
                  setTab(t.feed);
                  setGenre('');
                  setSort('pop');
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {error && items.length === 0 ? (
          <Status kind="error" text={error} retry={() => { setError(null); setPage(1); }} />
        ) : items.length === 0 && busy ? (
          <GridSkeleton />
        ) : items.length === 0 ? (
          <Status kind="empty" text="Nothing found here." />
        ) : (
          <>
            <div className="grid cards">{items.map((m) => <Poster key={mediaKey(m)} m={m} />)}</div>
            {page < pages && (
              <div className="center">
                <button className="btn" disabled={busy} onClick={() => setPage((p) => p + 1)}>
                  {busy ? 'Loading…' : `LOAD MORE ${word ? word.toUpperCase() : ''}`.trim()}
                </button>
              </div>
            )}
          </>
        )}
        {!kind && (
          <p className="muted small"><Link to="/" className="link">‹ Back to home</Link></p>
        )}
      </div>
    </main>
  );
}
