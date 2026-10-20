import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../state';
import Logo from './Logo';

const icons = {
  home: 'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  search: 'M11 4a7 7 0 1 0 4.2 12.6l4.1 4.1 1.4-1.4-4.1-4.1A7 7 0 0 0 11 4z',
  list: 'M12 21s-7.5-4.6-9.3-9.4C1.5 8 3.6 5 6.8 5c2 0 3.5 1.1 5.2 3 1.7-1.9 3.2-3 5.2-3 3.2 0 5.3 3 4.1 6.6C19.5 16.4 12 21 12 21z',
  genres: 'M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z',
  live: 'M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7.8 7.8 6.4 6.4a8 8 0 0 0 0 11.2l1.4-1.4a6 6 0 0 1 0-8.4zm8.4 0a6 6 0 0 1 0 8.4l1.4 1.4a8 8 0 0 0 0-11.2z',
  genres: 'M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z',
  live: 'M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7.8 7.8l1.4 1.4a4 4 0 0 0 0 5.6l-1.4 1.4a6 6 0 0 1 0-8.4zm8.4 0a6 6 0 0 1 0 8.4l-1.4-1.4a4 4 0 0 0 0-5.6zM5 5l1.4 1.4a8 8 0 0 0 0 11.2L5 19a10 10 0 0 1 0-14zm14 0a10 10 0 0 1 0 14l-1.4-1.4a8 8 0 0 0 0-11.2z',
  settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm8-3.5-.1-1.2 1.9-1.5-1.9-3.3-2.3.9a7 7 0 0 0-2-1.2L15.2 3h-3.8l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-.9L4.8 9.3l1.9 1.5L6.6 12l.1 1.2-1.9 1.5 1.9 3.3 2.3-.9a7 7 0 0 0 2 1.2l.4 2.7h3.8l.4-2.7a7 7 0 0 0 2-1.2l2.3.9 1.9-3.3-1.9-1.5z'
};

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function Navbar() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { session, openAuth } = useApp();
  const [q, setQ] = useState('');
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = q.trim();
    if (t) nav(`/search?q=${encodeURIComponent(t)}`);
  };

  return (
    <>
      <header className={`nav ${solid || pathname !== '/' ? 'solid' : ''}`}>
        <Link to="/" className="nav-logo" aria-label="Comvie home">
          <Logo size={34} />
        </Link>
        <nav className="nav-links" aria-label="Main">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/genres">Genres</NavLink>
          <NavLink to="/live">Live TV</NavLink>
          <NavLink to="/genres">Genres</NavLink>
          <NavLink to="/live">Live TV</NavLink>
          <NavLink to="/list">My List</NavLink>
        </nav>
        <form className="nav-search" onSubmit={submit} role="search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search movies, shows, anime…"
            aria-label="Search"
          />
        </form>
        <Link to="/settings" className="gear" aria-label="Settings">
          <Icon d={icons.settings} />
        </Link>
        <Link to="/settings" className="nav-gear" aria-label="Settings"><Icon d={icons.settings} /></Link>
        {session ? (
          <Link to="/settings" className="avatar" aria-label="Account settings">
            {session.email.slice(0, 1).toUpperCase()}
          </Link>
        ) : (
          <button className="btn small ghost nav-signin" onClick={openAuth}>Sign in</button>
        )}
      </header>

      <nav className="tabbar" aria-label="Tabs">
        <NavLink to="/" end><Icon d={icons.home} /><span>Home</span></NavLink>
        <NavLink to="/search"><Icon d={icons.search} /><span>Search</span></NavLink>
        <NavLink to="/genres"><Icon d={icons.genres} /><span>Genres</span></NavLink>
        <NavLink to="/live"><Icon d={icons.live} /><span>Live TV</span></NavLink>
        <NavLink to="/list"><Icon d={icons.list} /><span>My List</span></NavLink>
      </nav>
    </>
  );
}
