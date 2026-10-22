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
  const { provider: defaultProvider, recordWatch, isFavorite, toggleFavorite, isLoved, toggleLoved } = useApp();

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

  // Servers that refuse to run in a sandbox ("Please disable sandbox") are loaded without it
  const sandboxed = protect && provider.sandboxOk;
  const sandbox = sandboxed ? 'allow-scripts allow-same-origin allow-forms allow-presentation' : undefined;
  const nextServer = providers[(providers.findIndex((p) => p.id === pid) + 1) % providers.length];

  const m = d?.media;
  const fav = m ? isFavorite(m) : false;
  const love = m ? isLoved(m) : false;
  const epName = eps.find((x) => x.number === episode)?.name;

  return (
    <div className="wp">
      <div className="wp-top">
        <button className="btn small ghost" onClick={() => (window.history.length > 1 ? nav(-1) : nav(`/title/${t}/${mid}`))}>← Back</button>
        <span className="sp" />
        {m && (
          <>
            <button className="btn small ghost" onClick={() => toggleFavorite(m)}>{fav ? '✓ In Watchlist' : '+ Watchlist'}</button>
            <button className="btn small ghost" aria-label={love ? 'Remove from favorites' : 'Add to favorites'} aria-pressed={love} onClick={() => toggleLoved(m)}>{love ? '♥' : '♡'}</button>
          </>
        )}
      </div>

      <iframe
        key={`${url}|${reload}|${sandboxed}`}
        className="wp-frame"
        src={url}
        title={m?.title ?? 'Player'}
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        referrerPolicy="origin"
        sandbox={sandbox}
      />

      <div className="wp-servers">
        <b>STREAMING SERVER:</b>
        {providers.map((p) => (
          <button key={p.id} className={`pill ${p.id === pid ? 'on' : ''}`} onClick={() => setServer(p.id)}>
            {p.name} <small>({p.quality})</small>
          </button>
        ))}
        <button className="pill" onClick={() => setReload((n) => n + 1)}>↻ Reload</button>
        <button className="pill warn" onClick={() => setServer(nextServer.id)}>Not working? Try {nextServer.name}</button>
      </div>
      {protect && !provider.sandboxOk && (
        <p className="muted small" style={{ margin: '-4px 0 10px' }}>
          {provider.name} can't run with popup protection, so it plays without it. Server 1 supports it.
        </p>
      )}

      <div className="wp-info">
        {t === 'tv' && <span className="chip stat">Season {season} • Episode {episode}</span>}
        <h1>{m?.title ?? 'Loading…'}{epName ? ` — ${epName}` : ''}</h1>
        <div className="td-chips">
          {m && m.rating > 0 && <span className="chip star">★ {m.rating.toFixed(1)}</span>}
          {m?.year && <span className="chip">{m.year}</span>}
          {d?.status && <span className="chip">{d.status}</span>}
        </div>
        <div className="wp-tools">
          {t === 'tv' && episode > 1 && <button className="btn small ghost" onClick={() => go(season, episode - 1)}>‹ Prev</button>}
          {next && <button className="btn small ghost" onClick={() => go(next.s, next.e)}>Next ›</button>}
          <Link to={`/title/${t}/${mid}`} className="btn small ghost">Details</Link>
        </div>
        <p className="watch-help" style={{ background: 'none', padding: '14px 0', textAlign: 'left' }}>
          Video not loading? Try another server above or{' '}
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
          .
        </p>
      </div>
    </div>
  );
}
