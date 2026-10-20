import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DetailSkeleton, Grid, Status } from '../components/Rows';
import { profileSrc, tmdb } from '../lib/tmdb';
import type { Media, Person } from '../lib/types';

export default function PersonPage() {
  const { id } = useParams();
  const pid = Number(id);
  const [data, setData] = useState<{ person: Person; knownFor: Media[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [more, setMore] = useState(false);

  useEffect(() => {
    let live = true;
    setData(null);
    setError(null);
    setMore(false);
    tmdb.person(pid).then((r) => live && setData(r)).catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [pid]);

  if (error) return <main className="page pad-top"><Status kind="error" text={error} /></main>;
  if (!data) return <DetailSkeleton />;

  const { person: p, knownFor } = data;
  const long = p.bio.length > 520;
  const bio = !long || more ? p.bio : p.bio.slice(0, 520).replace(/\s+\S*$/, '') + '…';

  return (
    <main className="page pad-top">
      <div className="container">
        <p className="crumb"><button className="link" onClick={() => window.history.back()}>‹ Back</button></p>
        <div className="person-head">
          <span className="person-photo">
            {p.photo ? <img src={profileSrc(p.photo)} alt={p.name} /> : <b>{p.name.slice(0, 1)}</b>}
          </span>
          <div>
            <h1 className="title">{p.name}</h1>
            <p className="muted small">
              {[p.knownFor, p.born && `Born ${p.born}`, p.place].filter(Boolean).join(' · ')}
            </p>
            {p.bio ? (
              <p className="overview">
                {bio} {long && <button className="link" onClick={() => setMore(!more)}>{more ? 'Show less' : 'Read more'}</button>}
              </p>
            ) : (
              <p className="muted">No biography available.</p>
            )}
          </div>
        </div>
        {knownFor.length > 0 && (
          <>
            <h2 className="section">Known for</h2>
            <Grid items={knownFor} />
          </>
        )}
        <p className="muted small note"><Link to="/" className="link">Back to home</Link></p>
      </div>
    </main>
  );
}
