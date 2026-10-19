import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Grid, Status } from '../components/Rows';
import { tmdb } from '../lib/tmdb';
import type { Media } from '../lib/types';

export default function Search() {
  const [sp, setSp] = useSearchParams();
  const urlQ = sp.get('q') ?? '';
  const [q, setQ] = useState(urlQ);
  const [results, setResults] = useState<Media[] | null>(null);
  const [top, setTop] = useState<Media[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Follow the address bar (e.g. a search typed in the top bar), without eating spaces mid-typing
  useEffect(() => {
    setQ((cur) => (cur.trim() === urlQ ? cur : urlQ));
  }, [urlQ]);

  useEffect(() => {
    tmdb.trending().then(setTop).catch(() => undefined);
  }, []);

  // Debounced search
  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults(null);
      setError(null);
      return;
    }
    let live = true;
    const t = setTimeout(() => {
      setError(null);
      tmdb
        .search(term)
        .then((r) => live && setResults(r))
        .catch((e: Error) => live && setError(e.message));
      setSp({ q: term }, { replace: true });
    }, 350);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q, setSp]);

  return (
    <main className="page pad-top">
      <div className="container">
        <input
          className="field big"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search movies, shows, anime…"
          aria-label="Search"
        />
        {error ? (
          <Status kind="error" text={error} />
        ) : results === null ? (
          <>
            <h2 className="section">Top Searches</h2>
            <Grid items={top} />
          </>
        ) : results.length === 0 ? (
          <Status kind="empty" text={`Nothing found for "${q.trim()}".`} />
        ) : (
          <>
            <h2 className="section">Results</h2>
            <Grid items={results} />
          </>
        )}
      </div>
    </main>
  );
}
