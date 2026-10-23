import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import { votesShort } from '../lib/format';
import { IMG, backdropSet, backdropSrc, tmdb } from '../lib/tmdb';
import { mediaKey } from '../lib/types';
import type { Media } from '../lib/types';
import { useApp } from '../state';

const SLIDE_MS = 7000;


/** Rotating billboard: each trending title takes its turn every 7 seconds. */
export default function Billboard({ items }: { items: Media[] }) {
  const { isFavorite, toggleFavorite, isLoved, toggleLoved, history } = useApp();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [logos, setLogos] = useState<Record<string, string | null>>({});

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

  // Fetch the title logo for the slide on screen and the next one
  useEffect(() => {
    let live = true;
    [items[i], items[(i + 1) % Math.max(count, 1)]].forEach((m) => {
      if (!m) return;
      const k = mediaKey(m);
      if (k in logos) return;
      tmdb
        .logo(m.type, m.id)
        .then((l) => live && setLogos((cur) => (k in cur ? cur : { ...cur, [k]: l })))
        .catch(() => live && setLogos((cur) => ({ ...cur, [k]: null })));
    });
    return () => {
      live = false;
    };
    // logos is read only to skip titles already fetched
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, items, count]);

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
        const key = mediaKey(m);
        const fav = isFavorite(m);
        const love = isLoved(m);
        const on = n === i;
        const logo = logos[key];
        const resume = history.find((w) => mediaKey(w.media) === key);
        const playLabel = resume
          ? m.type === 'tv' && resume.season
            ? `Resume S${resume.season} E${resume.episode ?? 1}`
            : 'Resume'
          : 'Play';
        const playTo = `/watch/${m.type}/${m.id}${m.type === 'tv' ? `?s=${resume?.season ?? 1}&e=${resume?.episode ?? 1}` : ''}`;
        return (
          <div className={`slide ${on ? 'on' : ''}`} key={key} aria-hidden={!on} role="group" aria-label={`${n + 1} of ${count}`}>
            {m.backdrop && (
              <img
                src={backdropSrc(m.backdrop)}
                srcSet={backdropSet(m.backdrop)}
                sizes="100vw"
                alt=""
                loading={n === 0 ? 'eager' : 'lazy'}
                decoding="async"
                {...(n === 0 ? ({ fetchpriority: 'high' } as Record<string, string>) : {})}
              />
            )}
            <div className="billboard-fade" />
            <div className="billboard-body">
              <div className="bb-badges">
                <span className="bb-kind">FEATURED {m.type === 'tv' ? 'TV SERIES' : 'MOVIE'}</span>
                {m.rating > 0 && (
                  <span className="bb-pill good"><Icon name="star" size={13} fill />{m.rating.toFixed(1)}{m.votes ? <small>({votesShort(m.votes)})</small> : null}</span>
                )}
                {m.year && <span className="bb-pill"><Icon name="calendar" size={13} />{m.year}</span>}
              </div>
              {logo ? (
                <>
                  <img className="bb-logo" src={IMG.logo + logo} alt={m.title} />
                  <h1 className="sr-only">{m.title}</h1>
                </>
              ) : (
                <h1>{m.title}</h1>
              )}
              <p className="billboard-overview">{m.overview}</p>
              <div className="actions">
                <Link className="btn primary glow" to={playTo}><Icon name="play" size={15} fill />{playLabel}</Link>
                <Link className="btn ghost" to={`/title/${m.type}/${m.id}`}><Icon name="info" size={16} />Info</Link>
                <button className="btn ghost" onClick={() => toggleFavorite(m)}><Icon name={fav ? 'check' : 'bookmark'} size={16} />Watchlist</button>
                <button className="btn ghost round" aria-label={love ? 'Remove from favorites' : 'Add to favorites'} aria-pressed={love} onClick={() => toggleLoved(m)}><Icon name="heart" size={18} fill={love} /></button>
              </div>
            </div>
          </div>
        );
      })}
      {count > 1 && (
        <div className="dots" role="tablist" aria-label="Choose a featured title">
          {items.map((m, n) => (
            <button
              key={mediaKey(m)}
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
