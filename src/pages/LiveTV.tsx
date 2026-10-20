import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Status } from '../components/Rows';
import { loadIptv } from '../lib/iptv';
import type { Channel, IptvData } from '../lib/iptv';
import { store } from '../lib/storage';

type Cat = 'all' | 'fav' | 'recent' | string;
const CATS: { id: Cat; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'fav', label: 'Favorites' },
  { id: 'movies', label: 'Movies' },
  { id: 'sports', label: 'Sports' },
  { id: 'news', label: 'News' },
  { id: 'music', label: 'Music' },
  { id: 'kids', label: 'Kids' },
  { id: 'documentary', label: 'Documentary' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'recent', label: 'Recent' }
];
const PAGE = 48;
const START_TIMEOUT_MS = 20000;

type Phase = 'idle' | 'loading' | 'playing' | 'error';

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : 'General');

export default function LiveTV() {
  const [data, setData] = useState<IptvData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('all');
  const [cat, setCat] = useState<Cat>('all');
  const [httpsOnly, setHttpsOnly] = useState(true);
  const [shown, setShown] = useState(PAGE);
  const [current, setCurrent] = useState<Channel | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [attempt, setAttempt] = useState(0);
  const [favs, setFavs] = useState<string[]>(() => store.getTvFavs());
  const [recent, setRecent] = useState<string[]>(() => store.getTvRecent());
  const [copied, setCopied] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLElement>(null);

  const load = useCallback(() => {
    setLoadError(null);
    setData(null);
    loadIptv().then(setData).catch((e: Error) => setLoadError(e.message));
  }, []);
  useEffect(load, [load]);

  const flags = useMemo(() => new Map((data?.countries ?? []).map((c) => [c.code, c])), [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    let list = data.channels;
    if (httpsOnly) list = list.filter((c) => c.secure);
    if (country !== 'all') list = list.filter((c) => c.country === country);
    if (cat === 'fav') list = list.filter((c) => favs.includes(c.id));
    else if (cat === 'recent') {
      const by = new Map(list.map((c) => [c.id, c]));
      list = recent.map((id) => by.get(id)).filter((c): c is Channel => !!c);
    } else if (cat !== 'all') list = list.filter((c) => c.categories.includes(cat));
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (flags.get(c.country)?.name ?? '').toLowerCase().includes(q) ||
          c.categories.some((x) => x.includes(q))
      );
    }
    return list;
  }, [data, query, country, cat, httpsOnly, favs, recent, flags]);

  useEffect(() => setShown(PAGE), [query, country, cat, httpsOnly]);

  // Start / restart playback whenever the channel changes or "Retry" is pressed.
  useEffect(() => {
    const video = videoRef.current;
    if (!current || !video) return;
    let cancelled = false;
    let cleanup = () => {};
    let timer: ReturnType<typeof setTimeout> | undefined;
    setPhase('loading');

    const fail = () => {
      if (!cancelled) setPhase('error');
    };
    const ok = () => {
      if (cancelled) return;
      clearTimeout(timer);
      setPhase('playing');
    };
    timer = setTimeout(fail, START_TIMEOUT_MS);

    (async () => {
      try {
        const { default: Hls } = await import('hls.js');
        if (cancelled) return;
        if (Hls.isSupported()) {
          const hls = new Hls({ lowLatencyMode: true });
          hls.on(Hls.Events.ERROR, (_e, d) => {
            if (d.fatal) {
              clearTimeout(timer);
              fail();
            }
          });
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => undefined);
          });
          video.addEventListener('playing', ok, { once: true });
          hls.loadSource(current.url);
          hls.attachMedia(video);
          cleanup = () => {
            video.removeEventListener('playing', ok);
            hls.destroy();
          };
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.addEventListener('playing', ok, { once: true });
          video.onerror = () => {
            clearTimeout(timer);
            fail();
          };
          video.src = current.url;
          video.play().catch(() => undefined);
          cleanup = () => {
            video.removeEventListener('playing', ok);
            video.onerror = null;
            video.removeAttribute('src');
            video.load();
          };
        } else {
          clearTimeout(timer);
          fail();
        }
      } catch {
        clearTimeout(timer);
        fail();
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      cleanup();
    };
  }, [current, attempt]);

  const play = (c: Channel) => {
    setCurrent(c);
    setAttempt(0);
    setCopied(false);
    const next = [c.id, ...recent.filter((x) => x !== c.id)].slice(0, 30);
    setRecent(next);
    store.saveTvRecent(next);
    playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleFav = (id: string) => {
    const next = favs.includes(id) ? favs.filter((x) => x !== id) : [id, ...favs];
    setFavs(next);
    store.saveTvFavs(next);
  };

  const nextChannel = () => {
    if (!filtered.length) return;
    const i = current ? filtered.findIndex((c) => c.id === current.id) : -1;
    play(filtered[(i + 1) % filtered.length]);
  };

  const copyLink = async () => {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  if (loadError) return <main className="page pad-top"><Status kind="error" text={loadError} retry={load} /></main>;
  if (!data) return <main className="page pad-top"><Status kind="loading" /></main>;

  return (
    <main className="page pad-top">
      <div className="container">
        <section className="tv-hero">
          <span className="pill">Free public channels</span>
          <h1>Live TV &amp; <span className="accent">World Channels</span></h1>
          <p className="muted">Free public broadcasts from around the world, streamed live. Some channels may be offline or blocked in your region.</p>
          <div className="pills">
            <span className="pill">{data.channels.length.toLocaleString()} channels</span>
            <span className="pill">{data.countries.length}+ countries</span>
            <span className="pill">Free &amp; public streams</span>
          </div>
        </section>

        <section className="tv-player" ref={playerRef}>
          <h2 className="now">
            <span className="dot" aria-hidden="true" />
            {current ? <>Now Streaming: <span className="accent">{current.name}</span></> : 'Pick a channel to start watching'}
          </h2>
          <div className="tv-screen">
            <video ref={videoRef} controls playsInline autoPlay className={phase === 'playing' || phase === 'loading' ? '' : 'hidden'} />
            {!current && <div className="tv-overlay muted">Choose any channel below.</div>}
            {current && phase === 'loading' && <div className="tv-overlay"><div className="spinner" aria-label="Loading stream" /></div>}
            {current && phase === 'error' && (
              <div className="tv-overlay">
                <h3>Stream offline or restricted</h3>
                <p className="muted small">This broadcaster's server may be offline, blocked in your region, or not allow web playback. Try again, pick the next channel, or open the link directly.</p>
                <div className="actions center">
                  <button className="btn small" onClick={() => setAttempt((n) => n + 1)}>Retry</button>
                  <button className="btn small primary" onClick={nextChannel}>Next channel</button>
                  <button className="btn small ghost" onClick={() => void copyLink()}>{copied ? 'Copied' : 'Copy stream link'}</button>
                  <a className="btn small ghost" href={current.url} target="_blank" rel="noopener noreferrer">Direct link</a>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="tv-filters">
          <input
            className="field"
            placeholder="Search channels by name, country, or category…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search channels"
          />
          <select className="field select" value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country">
            <option value="all">All Countries</option>
            {data.countries.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            ))}
          </select>
          <label className="check">
            <input type="checkbox" checked={httpsOnly} onChange={(e) => setHttpsOnly(e.target.checked)} />
            <span>HTTPS only</span>
          </label>
        </div>

        <div className="chips flush" role="tablist" aria-label="Category">
          {CATS.map((c) => (
            <button key={c.id} role="tab" aria-selected={cat === c.id} className={`chip ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(c.id)}>
              {c.label}
            </button>
          ))}
        </div>

        <p className="muted small">
          Showing <strong>{Math.min(shown, filtered.length)}</strong> of <strong>{filtered.length.toLocaleString()}</strong> channels
          {!httpsOnly && ' (non-HTTPS streams are blocked by browsers on this site and usually won’t play)'}
        </p>

        {filtered.length === 0 ? (
          <Status kind="empty" text={cat === 'fav' ? 'No favorite channels yet. Tap the star on a channel.' : cat === 'recent' ? 'Nothing watched yet.' : 'No channels match.'} />
        ) : (
          <div className="channel-grid">
            {filtered.slice(0, shown).map((c) => {
              const f = flags.get(c.country);
              return (
                <div key={c.id} className={`channel ${current?.id === c.id ? 'on' : ''}`}>
                  <div className="channel-top">
                    <span>{f?.flag} {c.country}</span>
                    <button className={`star ${favs.includes(c.id) ? 'on' : ''}`} aria-label={favs.includes(c.id) ? `Remove ${c.name} from favorites` : `Add ${c.name} to favorites`} aria-pressed={favs.includes(c.id)} onClick={() => toggleFav(c.id)}>★</button>
                  </div>
                  <button className="channel-play" onClick={() => play(c)} aria-label={`Watch ${c.name}`}>
                    <span className="channel-logo">
                      {c.logo ? <img src={c.logo} alt="" loading="lazy" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} /> : null}
                    </span>
                    <strong>{c.name}</strong>
                    <span className="channel-meta">
                      <span>{cap(c.categories[0] ?? '')}</span>
                      {c.quality && <span className="tag">{c.quality.toUpperCase()}</span>}
                    </span>
                    <span className="live">HLS Live</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {shown < filtered.length && (
          <div className="center">
            <button className="btn" onClick={() => setShown((n) => n + PAGE)}>Load more</button>
          </div>
        )}
        <p className="tmdb-note">Channel list from the open-source iptv-org project. Comvie does not host any streams.</p>
      </div>
    </main>
  );
}
