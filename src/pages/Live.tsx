import { useEffect, useMemo, useRef, useState } from 'react';
import ChannelLogo from '../components/ChannelLogo';
import LivePlayer from '../components/LivePlayer';
import { Status } from '../components/Rows';
import { countryName, flag, loadChannels } from '../lib/iptv';
import type { Channel } from '../lib/iptv';
import { store } from '../lib/storage';

const PAGE = 48;
const BAD_MS = 3 * 24 * 3600 * 1000;

const CATS: { id: string; label: string }[] = [
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

export default function Live() {
  const [all, setAll] = useState<Channel[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<Channel | null>(null);
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const [httpsOnly, setHttpsOnly] = useState(true);
  const [cat, setCat] = useState('all');
  const [shown, setShown] = useState(PAGE);
  const [favs, setFavs] = useState<string[]>(() => store.getTvFavs());
  const listTop = useRef<HTMLDivElement>(null);
  const [bad, setBad] = useState<Record<string, number>>(() => store.getTvBad());
  const [showBad, setShowBad] = useState(false);
  const [lastId, setLastId] = useState(() => store.getTvLast());
  const [recent, setRecent] = useState<string[]>(() => store.getTvRecent());

  const load = () => {
    setError(null);
    setAll(null);
    loadChannels().then(setAll).catch((e: Error) => setError(e.message));
  };
  useEffect(load, []);

  const countries = useMemo(() => {
    const codes = new Set<string>();
    (all ?? []).forEach((c) => c.country && codes.add(c.country));
    return [...codes].map((code) => ({ code, name: countryName(code) })).sort((a, b) => a.name.localeCompare(b.name));
  }, [all]);

  // Channels that failed recently are hidden for 3 days (unless "Show offline" is on)
  const badCount = useMemo(
    () => (all ?? []).filter((c) => Date.now() - (bad[c.id] ?? 0) < BAD_MS).length,
    [all, bad]
  );

  const filtered = useMemo(() => {
    if (!all) return [];
    const term = q.trim().toLowerCase();
    let list = showBad ? all : all.filter((c) => c.id === current?.id || Date.now() - (bad[c.id] ?? 0) >= BAD_MS);
    if (httpsOnly) list = list.filter((c) => c.url.startsWith('https://'));
    if (country) list = list.filter((c) => c.country === country);
    if (cat === 'fav') list = list.filter((c) => favs.includes(c.id));
    else if (cat === 'recent') {
      const order = new Map(recent.map((id, i) => [id, i]));
      list = list.filter((c) => order.has(c.id)).sort((a, b) => order.get(a.id)! - order.get(b.id)!);
    } else if (cat !== 'all') list = list.filter((c) => c.categories.includes(cat));
    if (term) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          countryName(c.country).toLowerCase().includes(term) ||
          c.categories.some((x) => x.includes(term))
      );
    }
    return list;
  }, [all, q, country, httpsOnly, cat, favs, recent, bad, showBad, current]);

  useEffect(() => setShown(PAGE), [q, country, httpsOnly, cat, showBad]);

  const lastChannel = useMemo(() => (all && lastId ? all.find((c) => c.id === lastId) ?? null : null), [all, lastId]);

  const markBad = (id: string) => {
    const next = { ...bad, [id]: Date.now() };
    setBad(next);
    store.saveTvBad(next);
  };
  const clearBad = (id: string) => {
    if (!(id in bad)) return;
    const next = { ...bad };
    delete next[id];
    setBad(next);
    store.saveTvBad(next);
  };

  const play = (c: Channel) => {
    setCurrent(c);
    setLastId(c.id);
    store.saveTvLast(c.id);
    const next = [c.id, ...recent.filter((x) => x !== c.id)].slice(0, 30);
    setRecent(next);
    store.saveTvRecent(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const step = (dir: 1 | -1) => {
    if (!filtered.length) return;
    const i = current ? filtered.findIndex((c) => c.id === current.id) : -1;
    play(filtered[(i + dir + filtered.length) % filtered.length]);
  };
  const playNext = () => step(1);
  const playPrev = () => step(-1);

  const toggleFav = (id: string) => {
    const next = favs.includes(id) ? favs.filter((x) => x !== id) : [id, ...favs];
    setFavs(next);
    store.saveTvFavs(next);
  };

  return (
    <main className="page pad-top">
      <div className="container">
        <section className="live-hero">
          <span className="pill">FREE PUBLIC CHANNELS</span>
          <h1 className="title">Live TV &amp; <span className="accent">World Channels</span></h1>
          <p className="muted">Free public broadcasts from around the world, from the open iptv-org directory. Some channels are offline or blocked in your region.</p>
          {all && !current && lastChannel && (
            <button className="btn primary" onClick={() => play(lastChannel)}>▶ Resume {lastChannel.name}</button>
          )}
          {all && <p className="stats"><span>{all.length.toLocaleString()} channels</span><span>{countries.length} countries</span></p>}
        </section>

        {current && (
          <section className="now">
            <h2 className="section"><span className="live-dot" aria-hidden="true" /> Now streaming: <span className="accent">{current.name}</span></h2>
            <LivePlayer
              key={current.id}
              channel={current}
              onNext={playNext}
              onPrev={playPrev}
              fav={favs.includes(current.id)}
              onToggleFav={() => toggleFav(current.id)}
              onFail={() => markBad(current.id)}
              onOk={() => clearBad(current.id)}
              onShowList={() => listTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            />
          </section>
        )}

        {error ? (
          <Status kind="error" text={error} retry={load} />
        ) : !all ? (
          <Status kind="loading" />
        ) : (
          <>
            <div className="live-filters" ref={listTop}>
              <input className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search channels by name, country or category…" aria-label="Search channels" />
              <select className="field select" value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country">
                <option value="">All countries</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>{flag(c.code)} {c.name}</option>
                ))}
              </select>
              <label className="radio toggle">
                <input type="checkbox" checked={httpsOnly} onChange={(e) => setHttpsOnly(e.target.checked)} />
                <span>HTTPS only</span>
              </label>
              {badCount > 0 && (
                <label className="radio toggle">
                  <input type="checkbox" checked={showBad} onChange={(e) => setShowBad(e.target.checked)} />
                  <span>Show offline ({badCount})</span>
                </label>
              )}
            </div>
            <div className="chips flush" role="tablist" aria-label="Categories">
              {CATS.map((c) => (
                <button key={c.id} role="tab" aria-selected={cat === c.id} className={`chip ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(c.id)}>{c.label}</button>
              ))}
            </div>
            <p className="muted small">Showing {Math.min(shown, filtered.length)} of {filtered.length.toLocaleString()} channels</p>
            {!httpsOnly && <p className="muted small">Non-HTTPS channels usually can't play on a secure website. Leave “HTTPS only” on for best results.</p>}

            {filtered.length === 0 ? (
              <Status kind="empty" text={cat === 'fav' ? 'No favorite channels yet. Tap the star on a channel.' : 'No channels match.'} />
            ) : (
              <div className="channel-grid">
                {filtered.slice(0, shown).map((c) => (
                  <div key={c.id} className={`channel ${current?.id === c.id ? 'on' : ''}`}>
                    <div className="channel-top">
                      <span>{flag(c.country)} {c.country || 'INT'}</span>
                      <button className={`star ${favs.includes(c.id) ? 'on' : ''}`} aria-label={favs.includes(c.id) ? `Remove ${c.name} from favorites` : `Add ${c.name} to favorites`} aria-pressed={favs.includes(c.id)} onClick={() => toggleFav(c.id)}>★</button>
                    </div>
                    <button className="channel-play" onClick={() => play(c)} aria-label={`Play ${c.name}`}>
                      <ChannelLogo name={c.name} logos={c.logos} />
                      <strong>{c.name}</strong>
                      <span className="channel-meta">
                        <small>{c.categories[0] ?? 'general'}</small>
                        {c.quality && <em>{c.quality}</em>}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {shown < filtered.length && (
              <div className="center-row"><button className="btn" onClick={() => setShown((n) => n + PAGE)}>Load more</button></div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
