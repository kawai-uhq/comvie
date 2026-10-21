import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Grid, Status } from '../components/Rows';
import SearchBox from '../components/SearchBox';
import { tmdb } from '../lib/tmdb';
import type { Media } from '../lib/types';

export default function Search() {
  const [sp] = useSearchParams();
  const urlQ = sp.get('q') ?? '';
  const [q, setQ] = useState(urlQ);
  const [results, setResults] = useState<Media[] | null>(null);
  const [top, setTop] = useState<Media[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ticket = useRef(0); // only the newest request may update the page

  // A search sent from the top bar changes the address; follow it
  useEffect(() => {
    setQ(urlQ);
  }, [urlQ]);

  useEffect(() => {
    tmdb.trending().then(setTop).catch(() => undefined);
  }, []);

  const run = useCallback((term: string) => {
    const id = ++ticket.current;
    setBusy(true);
    setError(null);
    tmdb
      .search(term)
      .then((r) => {
        if (id !== ticket.current) return;
        setResults(r);
        setBusy(false);
      })
      .catch((e: Error) => {
        if (id !== ticket.current) return;
        setError(e.message || "Couldn't search. Try again.");
        setBusy(false);
      });
  }, []);

  const keepUrl = (term: string) => {
    // keeps the link shareable without re-rendering the page
    try {
      const path = window.location.pathname;
      window.history.replaceState(window.history.state, '', term ? `${path}?q=${encodeURIComponent(term)}` : path);
    } catch {
      /* ignore */
    }
  };

  // Search shortly after typing stops
  useEffect(() => {
    const term = q.trim();
    if (!term) {
      ticket.current++;
      setResults(null);
      setError(null);
      setBusy(false);
      keepUrl('');
      return;
    }
    const t = window.setTimeout(() => {
      run(term);
      keepUrl(term);
    }, 350);
    return () => window.clearTimeout(t);
  }, [q, run]);

  return (
    <main className="page pad-top">
      <div className="container">
        <SearchBox
          wide
          type="search"
          autoFocus
          inputClassName="field big"
          value={q}
          onChange={setQ}
          onSubmit={(term) => {
            run(term);
            keepUrl(term);
          }}
        />
        {error ? (
          <Status kind="error" text={error} retry={() => run(q.trim())} />
        ) : results === null && busy ? (
          <Status kind="loading" />
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
