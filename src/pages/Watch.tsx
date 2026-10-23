import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PosterRow } from '../components/Rows';
import { clearAt, clock, fractionOf, resumeAt, saveAt } from '../lib/progress';
import { providerById, providers } from '../lib/providers';
import { store } from '../lib/storage';
import { IMG, posterSrc, tmdb } from '../lib/tmdb';
import type { Details, Episode, Media, MediaType } from '../lib/types';
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
  const [more, setMore] = useState<Media[]>([]);
  const [viewSeason, setViewSeason] = useState(season);
  const [reload, setReload] = useState(0);
  const [protect, setProtect] = useState(store.getProtect());
  const [alive, setAlive] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    let live = true;
    tmdb.details(t, mid).then((r) => live && setD(r)).catch(() => undefined);
    tmdb.similar(t, mid).then((r) => live && setMore(r)).catch(() => undefined);
    return () => {
      live = false;
    };
  }, [t, mid]);

  // The episode list follows the playing season, until the viewer browses another one
  useEffect(() => setViewSeason(season), [season]);

  useEffect(() => {
    if (t !== 'tv') return;
    let live = true;
    tmdb.episodes(mid, viewSeason).then((r) => live && setEps(r)).catch(() => live && setEps([]));
    return () => {
      live = false;
    };
  }, [t, mid, viewSeason]);

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

  // Where to start: the saved spot minus 5 seconds. Read when the episode / server / reload changes,
  // never while playing (that would reload the player).
  const start = useMemo(
    () => resumeAt(t, mid, season, episode),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, mid, season, episode, pid, reload]
  );
  const url = t === 'movie' ? provider.movie(mid, start) : provider.tv(mid, season, episode, start);

  // Save the playback position the player reports
  const latest = useRef<{ pos: number; dur: number } | null>(null);
  const lastSave = useRef(0);
  useEffect(() => {
    latest.current = null;
    lastSave.current = 0;
    const flush = () => {
      const l = latest.current;
      if (l) saveAt(t, mid, season, episode, l.pos, l.dur);
    };
    const onMessage = (ev: MessageEvent) => {
      const r = provider.parse(ev);
      if (!r) return;
      setAlive(true);
      if (r.ended) {
        latest.current = null;
        clearAt(t, mid, season, episode);
        return;
      }
      if (r.t <= 0) return;
      latest.current = { pos: r.t, dur: r.d };
      if (Date.now() - lastSave.current > 5000) {
        lastSave.current = Date.now();
        flush();
      }
    };
    window.addEventListener('message', onMessage);
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [provider, t, mid, season, episode]);

  // Tell the viewer when a server is taking suspiciously long
  const sandboxed = protect && provider.sandboxOk;
  useEffect(() => {
    setAlive(false);
    setSlow(false);
    const h = window.setTimeout(() => setSlow(true), 20000);
    return () => window.clearTimeout(h);
  }, [url, reload, sandboxed]);

  const seasonInfo = d?.seasons.find((s) => s.number === season);
  const next = useMemo(() => {
    if (t !== 'tv' || !d) return null;
    if (seasonInfo && episode < seasonInfo.episodeCount) return { s: season, e: episode + 1 };
    if (d.seasons.some((s) => s.number === season + 1)) return { s: season + 1, e: 1 };
    return null;
  }, [t, d, seasonInfo, season, episode]);

  const go = (s: number, e: number) => {
    setSp({ s: String(s), e: String(e), p: pid }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const setServer = (p: string) =>
    setSp(t === 'tv' ? { s: String(season), e: String(episode), p } : { p }, { replace: true });

  // Servers that refuse to run in a sandbox ("Please disable sandbox") are loaded without it
  const sandbox = sandboxed ? 'allow-scripts allow-same-origin allow-forms allow-presentation' : undefined;
  const nextServer = providers[(providers.findIndex((p) => p.id === pid) + 1) % providers.length];

  const m = d?.media;
  const fav = m ? isFavorite(m) : false;
  const love = m ? isLoved(m) : false;
  const epName = viewSeason === season ? eps.find((x) => x.number === episode)?.name : undefined;

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
        sandbox={sandbox}
      />

      {slow && !alive && (
        <div className="wp-slow" role="status">
          <span>{provider.name} is taking a while to load.</span>
          <button className="pill warn" onClick={() => setServer(nextServer.id)}>Try {nextServer.name}</button>
          <button className="pill" onClick={() => setReload((n) => n + 1)}>↻ Reload</button>
        </div>
      )}

      <div className="wp-servers">
        <b>STREAMING SERVER:</b>
        {providers.map((p) => (
          <button key={p.id} className={`pill ${p.id === pid ? 'on' : ''}`} onClick={() => setServer(p.id)}>
            {p.name} <small>({p.quality})</small>
          </button>
        ))}
        <button className="pill" onClick={() => setReload((n) => n + 1)}>↻ Reload</button>
        {t === 'tv' && <span className="chip stat wp-ep">Season {season} • Episode {episode}</span>}
      </div>
      {start > 0 && (
        <p className="wp-resume">▶ Resumed from {clock(start)} — 5 seconds before where you stopped.</p>
      )}
      {protect && !provider.sandboxOk && (
        <p className="muted small" style={{ margin: '-4px 0 10px' }}>
          {provider.name} can't run with popup protection, so it plays without it. Server 1 supports it.
        </p>
      )}

      <div className="wp-main">
        <div className="wp-left">
          <div className="td-chips">
            {m && m.rating > 0 && (
              <span className="chip star">★ {m.rating.toFixed(1)}{d && d.votes > 0 && ` (${d.votes >= 1000 ? `${(d.votes / 1000).toFixed(1)}k` : d.votes})`}</span>
            )}
            {m?.year && <span className="chip">{m.year}</span>}
            {d?.status && <span className="chip">{d.status}</span>}
          </div>
          <h1>{m?.title ?? 'Loading…'}</h1>
          {epName && <p className="wp-epname">S{season} · E{episode} — {epName}</p>}
          {d?.tagline && <p className="wp-tag">“{d.tagline}”</p>}
          {d && d.genres.length > 0 && (
            <div className="td-chips">{d.genres.map((g) => <span key={g} className="chip">{g}</span>)}</div>
          )}
          <h3 className="wp-h">Overview</h3>
          <p className="wp-overview">{m?.overview || 'No description available.'}</p>

          <div className="wp-tools">
            {t === 'tv' && (episode > 1 || season > 1) && (
              <button
                className="btn small ghost"
                onClick={() => {
                  if (episode > 1) go(season, episode - 1);
                  else {
                    const ps = d?.seasons.find((s) => s.number === season - 1);
                    if (ps) go(ps.number, ps.episodeCount);
                  }
                }}
              >
                ‹ Prev
              </button>
            )}
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

          {t === 'tv' && d && d.seasons.length > 0 && (
            <section className="wp-eps">
              <div className="season-head">
                <div>
                  <h2 className="section">Episodes &amp; Seasons</h2>
                  <p className="ep-sub">Select an episode to watch now</p>
                </div>
                <select className="field select dd" value={viewSeason} onChange={(e) => setViewSeason(Number(e.target.value))} aria-label="Season">
                  {d.seasons.map((s) => (
                    <option key={s.number} value={s.number}>{s.name} ({s.episodeCount} Ep)</option>
                  ))}
                </select>
              </div>
              <div className="ep-list">
                {eps.map((e) => {
                  const now = viewSeason === season && e.number === episode;
                  const frac = fractionOf('tv', mid, viewSeason, e.number);
                  return (
                    <Link
                      key={e.number}
                      className={`ep-row ${now ? 'now' : ''}`}
                      replace
                      to={`/watch/tv/${mid}?s=${viewSeason}&e=${e.number}&p=${pid}`}
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                      <span className="ep-img">
                        {e.still ? <img src={IMG.still + e.still} alt="" loading="lazy" /> : null}
                        <span className="ep-tag">E{e.number}</span>
                        {frac > 0.02 && <span className="ep-prog"><i style={{ width: `${Math.round(frac * 100)}%` }} /></span>}
                      </span>
                      <span>
                        {e.rating > 0 && <span className="ep-score">★ {e.rating.toFixed(1)}</span>}
                        <h4>{e.number}. {e.name}</h4>
                        <span className="ep-meta">
                          {e.airDate && <span>📅 {e.airDate}</span>}
                          {e.runtime > 0 && <span>⏱ {e.runtime} min</span>}
                          {now && <span className="ep-now">▶ Now playing</span>}
                        </span>
                        <p>{e.overview || 'No description available.'}</p>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <aside className="wp-side">
          {m?.poster ? <img src={posterSrc(m.poster)} alt={m.title} /> : null}
        </aside>
      </div>

      <PosterRow title="Recommended Next" items={more} />
    </div>
  );
}
