import { useRef } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IMG } from '../lib/tmdb';
import { mediaKey, progressLabel } from '../lib/types';
import type { Media, WatchEntry } from '../lib/types';

export function Row({ title, children }: { title: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };
  return (
    <section className="row">
      <h2>{title}</h2>
      <div className="row-wrap">
        <button className="arrow left" aria-label="Scroll left" onClick={() => scroll(-1)}>‹</button>
        <div className="row-scroll" ref={ref}>{children}</div>
        <button className="arrow right" aria-label="Scroll right" onClick={() => scroll(1)}>›</button>
      </div>
    </section>
  );
}

export function Poster({ m, rank }: { m: Media; rank?: number }) {
  return (
    <Link to={`/title/${m.type}/${m.id}`} className={`poster ${rank ? 'ranked' : ''}`} title={m.title}>
      {rank ? <span className="rank" aria-hidden="true">{rank}</span> : null}
      <span className="poster-img">
        {m.poster ? (
          <img src={IMG.card + m.poster} alt={m.title} loading="lazy" />
        ) : (
          <span className="poster-missing">{m.title}</span>
        )}
      </span>
    </Link>
  );
}

export function PosterRow({ title, items, top10 }: { title: string; items: Media[]; top10?: boolean }) {
  if (!items.length) return null;
  const shown = top10 ? items.slice(0, 10) : items;
  return (
    <Row title={title}>
      {shown.map((m, i) => (
        <Poster key={mediaKey(m)} m={m} rank={top10 ? i + 1 : undefined} />
      ))}
    </Row>
  );
}

export function ContinueRow({ items, onRemove }: { items: WatchEntry[]; onRemove: (key: string) => void }) {
  if (!items.length) return null;
  return (
    <Row title="Continue Watching">
      {items.map((w) => {
        const m = w.media;
        const to = `/watch/${m.type}/${m.id}?s=${w.season ?? 1}&e=${w.episode ?? 1}&p=${w.providerId}`;
        const img = m.backdrop ? IMG.large + m.backdrop : m.poster ? IMG.card + m.poster : null;
        return (
          <div className="continue" key={mediaKey(m)}>
            <Link to={to} className="continue-img" aria-label={`Resume ${m.title}`}>
              {img && <img src={img} alt="" loading="lazy" />}
              <span className="play-badge" aria-hidden="true">▶</span>
            </Link>
            <div className="continue-meta">
              <div>
                <strong>{m.title}</strong>
                <small>{progressLabel(w)}</small>
              </div>
              <button className="x" aria-label={`Remove ${m.title} from Continue Watching`} onClick={() => onRemove(mediaKey(m))}>✕</button>
            </div>
          </div>
        );
      })}
    </Row>
  );
}

export function Grid({ items }: { items: Media[] }) {
  return (
    <div className="grid">
      {items.map((m) => (
        <Poster key={mediaKey(m)} m={m} />
      ))}
    </div>
  );
}

export function Status({ kind, text, retry }: { kind: 'loading' | 'error' | 'empty'; text?: string; retry?: () => void }) {
  if (kind === 'loading') return <div className="status"><div className="spinner" aria-label="Loading" /></div>;
  return (
    <div className="status">
      <p>{text}</p>
      {kind === 'error' && retry && <button className="btn" onClick={retry}>Try again</button>}
    </div>
  );
}
