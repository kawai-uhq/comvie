import { useCallback, useEffect, useState } from 'react';
import Billboard from '../components/Billboard';
import { ContinueRow, HomeSkeleton, PosterRow, Status } from '../components/Rows';
import { tmdb } from '../lib/tmdb';
import type { Media } from '../lib/types';
import { useApp } from '../state';

interface Rows {
  trending: Media[];
  popularMovies: Media[];
  popularTv: Media[];
  topMovies: Media[];
  topTv: Media[];
  anime: Media[];
}

type Filter = 'all' | 'tv' | 'movie' | 'anime';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'tv', label: 'TV Shows' },
  { id: 'movie', label: 'Movies' },
  { id: 'anime', label: 'Anime' }
];

export default function Home() {
  const { favorites, history, removeWatch } = useApp();
  const [rows, setRows] = useState<Rows | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(() => {
    setError(null);
    setRows(null);
    Promise.all([
      tmdb.trending(),
      tmdb.popular('movie'),
      tmdb.popular('tv'),
      tmdb.topRated('movie'),
      tmdb.topRated('tv'),
      tmdb.anime()
    ])
      .then(([trending, popularMovies, popularTv, topMovies, topTv, anime]) =>
        setRows({ trending, popularMovies, popularTv, topMovies, topTv, anime })
      )
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  if (error) return <main className="page pad-top"><Status kind="error" text={error} retry={load} /></main>;
  if (!rows) return <HomeSkeleton />;

  const byType = (t: 'movie' | 'tv') => rows.trending.filter((m) => m.type === t);
  const pool =
    filter === 'tv' ? [...byType('tv'), ...rows.popularTv]
    : filter === 'movie' ? [...byType('movie'), ...rows.popularMovies]
    : filter === 'anime' ? rows.anime
    : rows.trending;
  const heroes = pool.filter((m) => m.backdrop && m.overview).slice(0, 6);

  return (
    <main className="page">
      <Billboard key={filter} items={heroes} />
      <div className="chips" role="tablist" aria-label="Browse">
        {FILTERS.map((f) => (
          <button key={f.id} role="tab" aria-selected={filter === f.id} className={`chip ${filter === f.id ? 'on' : ''}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {filter === 'all' && (
        <>
          <ContinueRow items={history} onRemove={removeWatch} />
          <PosterRow title="My List" items={favorites} />
          <PosterRow title="Top 10 Today" items={rows.trending} top10 />
          <PosterRow title="Trending Now" items={rows.trending} />
          <PosterRow title="Popular Movies" items={rows.popularMovies} />
          <PosterRow title="Popular TV Shows" items={rows.popularTv} />
          <PosterRow title="Top Rated Movies" items={rows.topMovies} />
          <PosterRow title="Top Rated TV Shows" items={rows.topTv} />
          <PosterRow title="Anime" items={rows.anime} />
        </>
      )}
      {filter === 'tv' && (
        <>
          <PosterRow title="Top 10 TV Shows" items={byType('tv')} top10 />
          <PosterRow title="Popular TV Shows" items={rows.popularTv} />
          <PosterRow title="Top Rated TV Shows" items={rows.topTv} />
          <PosterRow title="Anime" items={rows.anime} />
        </>
      )}
      {filter === 'movie' && (
        <>
          <PosterRow title="Top 10 Movies" items={byType('movie')} top10 />
          <PosterRow title="Popular Movies" items={rows.popularMovies} />
          <PosterRow title="Top Rated Movies" items={rows.topMovies} />
        </>
      )}
      {filter === 'anime' && <PosterRow title="Popular Anime" items={rows.anime} />}
    </main>
  );
}
