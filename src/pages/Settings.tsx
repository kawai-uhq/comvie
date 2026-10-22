import { signInComingSoon } from '../lib/auth';
import { providers } from '../lib/providers';
import { isSmooth, setSmooth } from '../lib/perf';
import { store } from '../lib/storage';
import { useState } from 'react';
import { useApp } from '../state';

export default function Settings() {
  const { provider, setProvider, session, openAuth, signOut } = useApp();
  const [protect, setProtect] = useState(store.getProtect());
  const [smooth, setSmoothOn] = useState(isSmooth());

  return (
    <main className="page pad-top">
      <div className="container narrow">
        <h1 className="title">Settings</h1>

        <h2 className="label">DEFAULT SERVER</h2>
        <div className="radios">
          {providers.map((p) => (
            <label key={p.id} className="radio">
              <input type="radio" name="provider" checked={provider === p.id} onChange={() => setProvider(p.id)} />
              <span>{p.name}</span>
            </label>
          ))}
        </div>

        <h2 className="label">POPUP PROTECTION</h2>
        <label className="radio">
          <input
            type="checkbox"
            checked={protect}
            onChange={(e) => {
              setProtect(e.target.checked);
              store.saveProtect(e.target.checked);
            }}
          />
          <span>Block popups and redirects from the player</span>
        </label>
        <p className="muted small">If a server refuses to load, switch this off or pick another server.</p>

        <h2 className="label">PERFORMANCE</h2>
        <label className="radio">
          <input
            type="checkbox"
            checked={smooth}
            onChange={(e) => {
              setSmoothOn(e.target.checked);
              setSmooth(e.target.checked);
            }}
          />
          <span>Smooth mode</span>
        </label>
        <p className="muted small">Fade-in pages, lighter card effects and instant title pages. If your device feels slow or you prefer the plain look, switch it off.</p>

        <h2 className="label">ACCOUNT</h2>
        {signInComingSoon ? (
          <p className="muted small">
            Accounts are coming soon, within about 2 weeks. Until then, your Watchlist, Favorites and watch history are saved on this device only.
          </p>
        ) : session ? (
          <>
            <p>{session.email}</p>
            <p className="muted small">Your Watchlist, Favorites and watch history are saved to this account. Signing out keeps what is already on this device.</p>
            <button className="btn ghost" onClick={signOut}>Sign out</button>
          </>
        ) : (
          <>
            <p className="muted small">You're not signed in. Watchlist, Favorites and watch history stay in this browser and are lost if you clear its data. Sign in to save them to your account and restore them anywhere.</p>
            <button className="btn primary" onClick={openAuth}>Sign in or sign up</button>
          </>
        )}

        <p className="muted small fine">
          Comvie (comfy + movie). This product uses the TMDB API but is not endorsed or certified by TMDB. Playback comes from third-party embed players.
        </p>
      </div>
    </main>
  );
}
