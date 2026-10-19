import { Link } from 'react-router-dom';
import { IMG } from '../lib/tmdb';
import type { Media } from '../lib/types';
import { useApp } from '../state';

export default function Billboard({ m }: { m: Media }) {
  const { isFavorite, toggleFavorite } = useApp();
  const fav = isFavorite(m);
  return (
    <section className="billboard">
      {m.backdrop && <img src={IMG.original + m.backdrop} alt="" />}
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
    </section>
  );
}
