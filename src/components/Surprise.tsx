import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { tmdb } from '../lib/tmdb';
import type { MediaType } from '../lib/types';

/** Opens a random well-rated title. */
export default function Surprise({ type, genre, className = 'btn small ghost' }: { type?: MediaType; genre?: string; className?: string }) {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [none, setNone] = useState(false);

  const go = async () => {
    setBusy(true);
    setNone(false);
    try {
      const m = await tmdb.surprise(type, genre);
      if (m) nav(`/title/${m.type}/${m.id}`);
      else setNone(true);
    } catch {
      setNone(true);
    }
    setBusy(false);
  };

  return (
    <button type="button" className={className} disabled={busy} onClick={() => void go()}>
      {busy ? 'Picking…' : <><Icon name="shuffle" size={16} />{none ? 'Try again' : 'Surprise me'}</>}
    </button>
  );
}
