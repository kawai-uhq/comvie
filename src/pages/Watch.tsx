import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { providerById, providers } from '../lib/providers';
import { store } from '../lib/storage';
import { tmdb } from '../lib/tmdb';
import type { Details, Episode, MediaType } from '../lib/types';
import { useApp } from '../state';

export default function Watch() {
  const { type, id } = useParams();
  const t: MediaType = type === 'tv' ? 'tv' : 'movie';
  const mid = Number(id);
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const { provider: defaultProvider, recordWatch } = useApp();

  const season = Math.max(1, Number(sp.get('s')) || 1);
  const episode = Math.max(1, Number(sp.get('e')) || 1);
  const pid = providerById(sp.get('p') ?? defaultProvider).id;
  const provider = providerById(pid);

  const [d, setD] = useState<Details | null>(null);
  const [eps, setEps] = useState<Episode[]>([]);
  const [reload, setReload] = useState(0);
  const [protect, setProtect] = useState(store.getProtect());

  useEffect(() => {
    let live = true;
    tmdb.details(t, mid).then((r) => live && setD(r)).catch(() => undefined);
    return () => {
      live = false;
    };
  }, [t, mid]);

  useEffect(() => {
    if (t !== 'tv') return;
    let live = true;
    tmdb.episodes(mid, season).then((r) => live && setEps(r)).catch(() => live && setEps([]));
    return () => {
      live = false;
    };
  }, [t, mid, season]);

  // Remember what is being watched
  useEffect(() => {
    if (!d) return;
    recordWatch({
      media: d.media,
      season: t === 'tv' ? season : null,
      episode: t === 'tv' ? episode : null,
      providerId: pid,
      watchedAt: Date.now()
    });
    // only when the title / episode / server changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, season, episode, pid]);

  const url = t === 'movie' ? provider.movie(mid) : provider.tv(mid, season, episode);

  const next = useMemo(() => {
    if (t !== 'tv' || !d) return null;
    if (eps.length && episode < eps.length) return { s: season, e: episode + 1 };
    if (d.seasons.some((s) => s.number === season + 1)) return { s: season + 1, e: 1 };
    return null;
  }, [t, d, eps, season, episode]);

  const go = (s: number, e: number) => setSp({ s: String(s), e: String(e), p: pid }, { replace: true });
  const setServer = (p: string) =>
    setSp(t === 'tv' ? { s: String(season), e: String(episode), p } : { p }, { replace: true });

  const sandbox = protect ? 'allow-scripts allow-same-origin allow-forms allow-presentation' : undefined;

  return (
    <div className="watch">
      <div className="watch-bar">
        <button className="btn small ghost" onClick={() => (window.history.length > 1 ? nav(-1) : nav(`/title/${t}/${mid}`))}>← Back</button>
        <div className="watch-title">
          <strong>{d?.media.title ?? 'Loading…'}</strong>
          {t === 'tv' && <small>S{season} · E{episode}</small>}
        </div>
        <div className="watch-tools">
          {t === 'tv' && episode > 1 && <button className="btn small ghost" onClick={() => go(season, episode - 1)}>‹ Prev</button>}
          {next && <button className="btn small ghost" onClick={() => go(next.s, next.e)}>Next ›</button>}
          <select className="field select small" value={pid} onChange={(e) => setServer(e.target.value)} aria-label="Server">
            {providers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button className="btn small ghost" onClick={() => setReload((n) => n + 1)}>Reload</button>
        </div>
      </div>

      <iframe
        key={`${url}|${reload}|${protect}`}
        className="player"
        src={url}
        title={d?.media.title ?? 'Player'}
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        referrerPolicy="origin"
        sandbox={sandbox}
      />

      <div className="watch-help">
        Video not loading? Try another server above
        {' or '}
        <button
          className="link"
          onClick={() => {
            const v = !protect;
            setProtect(v);
            store.saveProtect(v);
          }}
        >
          turn popup protection {protect ? 'off' : 'on'}
        </button>
        . <Link to={`/title/${t}/${mid}`} className="link">Details</Link>
      </div>
    </div>
  );
}
