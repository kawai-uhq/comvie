import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Grid, Status } from '../components/Rows';
import { signInComingSoon } from '../lib/auth';
import { mediaKey } from '../lib/types';
import type { WatchEntry } from '../lib/types';
import { useApp } from '../state';

type Tab = 'history' | 'list';

const when = (t: number) =>
  new Date(t).toLocaleString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function HistoryRow({ w, onRemove }: { w: WatchEntry; onRemove: () => void }) {
  const m = w.media;
  const tv = m.type === 'tv' && w.season && w.episode;
  const to = `/watch/${m.type}/${m.id}?s=${w.season ?? 1}&e=${w.episode ?? 1}&p=${w.providerId}`;
  return (
    <div className="hrow">
      <Link to={to} className="hplay" aria-label={`Resume ${m.title}`}>▶</Link>
      <div className="hinfo">
        <strong>
          {m.title}
          {tv ? <span className="htag">S{w.season} • E{w.episode}</span> : null}
        </strong>
        <small>{m.type === 'tv' ? '📺 TV Series' : '🎬 Movie'} · {when(w.watchedAt)}</small>
      </div>
      <Link to={to} className="btn small primary hresume">▶ {tv ? `Resume S${w.season} E${w.episode}` : 'Resume'}</Link>
      <button className="x" aria-label={`Remove ${m.title} from history`} onClick={onRemove}>🗑</button>
    </div>
  );
}

export default function MyList() {
  const { favorites, history, removeWatch, session, openAuth } = useApp();
  const [tab, setTab] = useState<Tab>('history');

  return (
    <main className="page pad-top">
      <div className="container mid">
        <div className="page-head">
          <div>
            <h1 className="title">My <span className="accent">Library</span></h1>
            <p className="muted">Manage your watch history and saved watchlist{session ? '.' : ' (saved locally on your device).'}</p>
          </div>
        </div>

        <div className="lib-tabs">
          <div className="pills" style={{ margin: 0, justifyContent: 'flex-start' }} role="tablist">
            <button role="tab" aria-selected={tab === 'history'} className={`pill ${tab === 'history' ? 'on' : ''}`} onClick={() => setTab('history')}>🕘 History ({history.length})</button>
            <button role="tab" aria-selected={tab === 'list'} className={`pill ${tab === 'list' ? 'on' : ''}`} onClick={() => setTab('list')}>🔖 Watchlist ({favorites.length})</button>
          </div>
          {tab === 'history' && history.length > 0 && (
            <button
              className="btn small ghost"
              onClick={() => {
                if (window.confirm('Clear your whole watch history?')) history.forEach((w) => removeWatch(mediaKey(w.media)));
              }}
            >
              🗑 Clear History
            </button>
          )}
        </div>

        {tab === 'history' ? (
          history.length === 0 ? (
            <Status kind="empty" text="Nothing watched yet. Titles you play show up here so you can resume them." />
          ) : (
            <div className="hlist">
              {history.map((w) => (
                <HistoryRow key={mediaKey(w.media)} w={w} onRemove={() => removeWatch(mediaKey(w.media))} />
              ))}
            </div>
          )
        ) : favorites.length === 0 ? (
          <Status kind="empty" text="Nothing here yet. Tap “Watchlist” on any title to save it." />
        ) : (
          <Grid items={favorites} />
        )}

        {!session && (
          <p className="muted note">
            {signInComingSoon ? (
              'Saved on this device only. Accounts are coming soon, within about 2 weeks.'
            ) : (
              <>Saved on this device only. <button className="link" onClick={openAuth}>Sign in</button> to keep it if you clear your browser or switch devices.</>
            )}
          </p>
        )}
      </div>
    </main>
  );
}
