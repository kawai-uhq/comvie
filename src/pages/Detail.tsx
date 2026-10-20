import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DetailSkeleton, PosterRow, Row, Status } from '../components/Rows';
import TrailerModal from '../components/TrailerModal';
import { IMG, backdropSet, backdropSrc, profileSrc, tmdb } from '../lib/tmdb';
import { mediaKey } from '../lib/types';
import type { CastMember, Details, Episode, Media, MediaType } from '../lib/types';
import { useApp } from '../state';

export default function DetailPage() {
  const { type, id } = useParams();
  const t: MediaType = type === 'tv' ? 'tv' : 'movie';
  const mid = Number(id);
  const { isFavorite, toggleFavorite, history } = useApp();

  const [d, setD] = useState<Details | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [season, setSeason] = useState(1);
  const [eps, setEps] = useState<Episode[]>([]);
  const [more, setMore] = useState<Media[]>([]);
  const [toast, setToast] = useState('');
  const [trailer, setTrailer] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [directors, setDirectors] = useState<string[]>([]);

  useEffect(() => {
    let live = true;
    setD(null);
    setError(null);
    setEps([]);
    setMore([]);
    setTrailer(null);
    setShowTrailer(false);
    setCast([]);
    setDirectors([]);
    const resume = history.find((w) => w.media.id === mid && w.media.type === t);
    setSeason(resume?.season ?? 1);
    tmdb.details(t, mid).then((r) => live && setD(r)).catch((e: Error) => live && setError(e.message));
    tmdb.similar(t, mid).then((r) => live && setMore(r)).catch(() => undefined);
    tmdb.trailer(t, mid).then((k) => live && setTrailer(k)).catch(() => undefined);
    tmdb
      .credits(t, mid)
      .then((c) => {
        if (!live) return;
        setCast(c.cast);
        setDirectors(c.directors);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
    // history only seeds the starting season
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, mid]);

  useEffect(() => {
    if (t !== 'tv') return;
    let live = true;
    tmdb.episodes(mid, season).then((r) => live && setEps(r)).catch(() => live && setEps([]));
    return () => {
      live = false;
    };
  }, [t, mid, season]);

  if (error) return <main className="page pad-top"><Status kind="error" text={error} /></main>;
  if (!d) return <DetailSkeleton />;

  const m = d.media;
  const resume = history.find((w) => mediaKey(w.media) === mediaKey(m));
  const playTo = `/watch/${m.type}/${m.id}${m.type === 'tv' ? `?s=${resume?.season ?? 1}&e=${resume?.episode ?? 1}` : ''}`;
  const fav = isFavorite(m);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: m.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setToast('Link copied');
        setTimeout(() => setToast(''), 1800);
      }
    } catch {
      /* dismissed */
    }
  };

  return (
    <main className="page">
      <section className="hero">
        {m.backdrop && <img src={backdropSrc(m.backdrop)} srcSet={backdropSet(m.backdrop)} sizes="100vw" alt="" />}
        <div className="billboard-fade" />
        <div className="billboard-body">
          <h1>{m.title}</h1>
          {d.tagline && <p className="tagline">{d.tagline}</p>}
          <p className="billboard-meta">
            <span className="match">{Math.round(m.rating * 10)}% match</span>
            {m.year && <span>{m.year}</span>}
            {d.runtime > 0 && <span>{d.runtime} min</span>}
            {m.type === 'tv' && d.seasons.length > 0 && <span>{d.seasons.length} season{d.seasons.length > 1 ? 's' : ''}</span>}
          </p>
          <div className="actions">
            <Link className="btn primary" to={playTo}>▶ {resume ? 'Resume' : 'Play'}</Link>
            <button className="btn ghost" onClick={() => toggleFavorite(m)}>{fav ? '✓ In My List' : '+ My List'}</button>
            {trailer && <button className="btn ghost" onClick={() => setShowTrailer(true)}>▶ Trailer</button>}
            <button className="btn ghost" onClick={() => void share()}>Share</button>
          </div>
          {toast && <p className="muted small" role="status">{toast}</p>}
        </div>
      </section>

      <div className="container">
        <p className="overview">{m.overview || 'No description available.'}</p>
        {directors.length > 0 && <p className="muted small">Director: {directors.join(', ')}</p>}
        {d.genres.length > 0 && (
          <p className="genres">{d.genres.map((g) => <span key={g}>{g}</span>)}</p>
        )}

        {m.type === 'tv' && d.seasons.length > 0 && (
          <section>
            <div className="season-head">
              <h2 className="section">Episodes</h2>
              <select className="field select" value={season} onChange={(e) => setSeason(Number(e.target.value))} aria-label="Season">
                {d.seasons.map((s) => (
                  <option key={s.number} value={s.number}>{s.name}</option>
                ))}
              </select>
            </div>
            <ol className="episodes">
              {eps.map((e) => (
                <li key={e.number}>
                  <Link to={`/watch/tv/${m.id}?s=${season}&e=${e.number}`}>
                    <span className="ep-num">{e.number}</span>
                    <span className="ep-img">{e.still ? <img src={IMG.still + e.still} alt="" loading="lazy" /> : null}</span>
                    <span className="ep-text">
                      <strong>{e.name}</strong>
                      {e.runtime > 0 && <small>{e.runtime} min</small>}
                      <span>{e.overview}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
      {cast.length > 0 && (
        <Row title="Cast">
          {cast.map((c) => (
            <Link key={c.id} to={`/person/${c.id}`} className="cast-card">
              <span className="cast-photo">
                {c.photo ? <img src={profileSrc(c.photo)} alt="" loading="lazy" /> : <b>{c.name.slice(0, 1)}</b>}
              </span>
              <strong>{c.name}</strong>
              {c.character && <small>{c.character}</small>}
            </Link>
          ))}
        </Row>
      )}
      <PosterRow title="More Like This" items={more} />
      {showTrailer && trailer && <TrailerModal videoKey={trailer} title={m.title} onClose={() => setShowTrailer(false)} />}
    </main>
  );
}
