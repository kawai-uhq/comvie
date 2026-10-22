import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useNewEpisodes } from '../lib/useNewEpisodes';
import { useApp } from '../state';
import Logo from './Logo';
import SearchBox from './SearchBox';

const icons = {
  home: 'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  search: 'M11 4a7 7 0 1 0 4.2 12.6l4.1 4.1 1.4-1.4-4.1-4.1A7 7 0 0 0 11 4z',
  list: 'M12 21s-7.5-4.6-9.3-9.4C1.5 8 3.6 5 6.8 5c2 0 3.5 1.1 5.2 3 1.7-1.9 3.2-3 5.2-3 3.2 0 5.3 3 4.1 6.6C19.5 16.4 12 21 12 21z',
  genres: 'M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z',
  live: 'M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7.8 7.8l1.4 1.4a4 4 0 0 0 0 5.6l-1.4 1.4a6 6 0 0 1 0-8.4zm8.4 0a6 6 0 0 1 0 8.4l-1.4-1.4a4 4 0 0 0 0-5.6zM5 5l1.4 1.4a8 8 0 0 0 0 11.2L5 19a10 10 0 0 1 0-14zm14 0a10 10 0 0 1 0 14l-1.4-1.4a8 8 0 0 0 0-11.2z',
  movie: 'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm1 2v2h2V6zm0 4v2h2v-2zm0 4v2h2v-2zm12-8v2h2V6zm0 4v2h2v-2zm0 4v2h2v-2zM9 6v12h6V6z',
  tv: 'M4 7h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zm4-4 4 3 4-3 1.2 1.6L12 8 6.8 4.6z',
  settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm8-3.5-.1-1.2 1.9-1.5-1.9-3.3-2.3.9a7 7 0 0 0-2-1.2L15.2 3h-3.8l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-.9L4.8 9.3l1.9 1.5L6.6 12l.1 1.2-1.9 1.5 1.9 3.3 2.3-.9a7 7 0 0 0 2 1.2l.4 2.7h3.8l.4-2.7a7 7 0 0 0 2-1.2l2.3.9 1.9-3.3-1.9-1.5z'
};

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function Navbar() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { session, openAuth } = useApp();
  const fresh = useNewEpisodes();
  const [q, setQ] = useState('');
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header className={`nav ${solid || pathname !== '/' ? 'solid' : ''}`}>
        <div className="nav-pill">
          <Link to="/" className="nav-logo" aria-label="Comvie home">
            <Logo size={30} />
          </Link>
          <nav className="nav-links" aria-label="Main">
            <NavLink to="/" end><Icon d={icons.home} />Home</NavLink>
            <NavLink to="/movies"><Icon d={icons.movie} />Movies</NavLink>
            <NavLink to="/tv"><Icon d={icons.tv} />TV Shows</NavLink>
            <NavLink to="/live"><Icon d={icons.live} />Live TV</NavLink>
            <NavLink to="/genres"><Icon d={icons.genres} />Genres</NavLink>
            <NavLink to="/list"><Icon d={icons.list} />My Library{fresh.size > 0 && <span className="nav-dot" aria-label={`${fresh.size} new episodes`} data-tip={`${fresh.size} new episode${fresh.size > 1 ? 's' : ''}`} />}</NavLink>
          </nav>
          <SearchBox
            className="nav-search"
            value={q}
            onChange={setQ}
            onSubmit={(t) => {
              nav(`/search?q=${encodeURIComponent(t)}`);
              setQ('');
            }}
            onPick={() => setQ('')}
          />
          <Link to="/settings" className="gear" aria-label="Settings">
            <Icon d={icons.settings} />
          </Link>
          {session ? (
            <Link to="/settings" className="avatar" aria-label="Account settings">
              {session.email.slice(0, 1).toUpperCase()}
            </Link>
          ) : (
            <button className="nav-signin" onClick={openAuth}>Sign in</button>
          )}
        </div>
      </header>

      <nav className="tabbar" aria-label="Tabs">
        <NavLink to="/" end><Icon d={icons.home} /><span>Home</span></NavLink>
        <NavLink to="/search"><Icon d={icons.search} /><span>Search</span></NavLink>
        <NavLink to="/movies"><Icon d={icons.movie} /><span>Movies</span></NavLink>
        <NavLink to="/tv"><Icon d={icons.tv} /><span>TV</span></NavLink>
        <NavLink to="/live"><Icon d={icons.live} /><span>Live</span></NavLink>
        <NavLink to="/list"><Icon d={icons.list} /><span>Library</span>{fresh.size > 0 && <i className="nav-dot" />}</NavLink>
      </nav>
    </>
  );
}
