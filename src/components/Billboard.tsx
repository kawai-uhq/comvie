import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { backdropSet, backdropSrc } from '../lib/tmdb';
import type { Media } from '../lib/types';
import { useApp } from '../state';

const SLIDE_MS = 7000;

/** Rotating billboard: each trending title takes its turn every 7 seconds. */
export default function Billboard({ items }: { items: Media[] }) {
  const { isFavorite, toggleFavorite } = useApp();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  const reduced = typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const count = items.length;

  useEffect(() => {
    if (count < 2 || paused || reduced) return;
    const t = window.setTimeout(() => setI((x) => (x + 1) % count), SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [i, paused, reduced, count]);

  useEffect(() => {
    if (i >= count) setI(0);
  }, [count, i]);

  if (!count) return null;

  return (
    <section
      className="billboard"
      aria-roledescription="carousel"
      aria-label="Featured titles"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {items.map((m, n) => {
        const fav = isFavorite(m);
        const on = n === i;
        return (
          <div className={`slide ${on ? 'on' : ''}`} key={`${m.type}:${m.id}`} aria-hidden={!on} role="group" aria-label={`${n + 1} of ${count}`}>
            {m.backdrop && (
              <img
                src={backdropSrc(m.backdrop)}
                srcSet={backdropSet(m.backdrop)}
                sizes="100vw"
                alt=""
                loading={n === 0 ? 'eager' : 'lazy'}
              />
            )}
            <div className="billboard-fade" />
            <div className="billboard-body">
              <span className="kicker">{m.type === 'tv' ? 'SERIES' : 'FILM'}</span>
              <h1>{m.title}</h1>
              <p className="billboard-meta">
                <span className="match">{Math.round(m.rating * 10)}% match</span>
                {m.year && <span>{m.year}</span>}
              </p>
              <p className="billboard-overview">{m.overview}</p>
              <div className="actions">
                <Link className="btn primary" to={`/watch/${m.type}/${m.id}`}>▶ Play</Link>
                <button className="btn ghost" onClick={() => toggleFavorite(m)}>{fav ? '✓ In My List' : '+ My List'}</button>
                <Link className="btn ghost" to={`/title/${m.type}/${m.id}`}>More info</Link>
              </div>
            </div>
          </div>
        );
      })}
      {count > 1 && (
        <div className="dots" role="tablist" aria-label="Choose a featured title">
          {items.map((m, n) => (
            <button
              key={`${m.type}:${m.id}`}
              role="tab"
              aria-selected={n === i}
              aria-label={`Show ${m.title}`}
              className={n === i ? 'on' : ''}
              onClick={() => setI(n)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
