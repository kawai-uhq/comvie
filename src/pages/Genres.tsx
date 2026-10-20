import { useState } from 'react';
import { Link } from 'react-router-dom';
import { genresFor } from '../lib/genres';
import type { MediaType } from '../lib/types';

export default function Genres() {
  const [type, setType] = useState<MediaType>('movie');
  return (
    <main className="page pad-top">
      <div className="container">
        <div className="page-head">
          <div>
            <h1 className="title">Browse by <span className="accent">Genre</span></h1>
            <p className="muted">Pick a genre to explore top movies or TV series for your mood.</p>
          </div>
          <div className="seg" role="tablist" aria-label="Type">
            <button role="tab" aria-selected={type === 'movie'} className={type === 'movie' ? 'on' : ''} onClick={() => setType('movie')}>Movie Genres</button>
            <button role="tab" aria-selected={type === 'tv'} className={type === 'tv' ? 'on' : ''} onClick={() => setType('tv')}>TV Series Genres</button>
          </div>
        </div>
        <div className="genre-grid">
          {genresFor(type).map((g) => (
            <Link
              key={g.id}
              to={`/genres/${type}/${g.id}`}
              className="genre-card"
              style={{ '--h': g.hue } as React.CSSProperties}
            >
              <span className="genre-letter" aria-hidden="true">{g.name.slice(0, 1)}</span>
              <strong>{g.name}</strong>
              <small>Explore {type === 'tv' ? 'Shows' : 'Movies'} →</small>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
