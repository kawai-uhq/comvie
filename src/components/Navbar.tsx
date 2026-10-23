import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useNewEpisodes } from '../lib/useNewEpisodes';
import { useApp } from '../state';
import Icon from './Icon';
import Logo from './Logo';
import SearchBox from './SearchBox';

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
            <NavLink to="/" end><Icon name="home" size={18} />Home</NavLink>
            <NavLink to="/movies"><Icon name="film" size={18} />Movies</NavLink>
            <NavLink to="/tv"><Icon name="tv" size={18} />TV Shows</NavLink>
            <NavLink to="/live"><Icon name="live" size={18} />Live TV</NavLink>
            <NavLink to="/genres"><Icon name="grid" size={18} />Genres</NavLink>
            <NavLink to="/list"><Icon name="bookmark" size={18} />My Library{fresh.size > 0 && <span className="nav-dot" aria-label={`${fresh.size} new episodes`} data-tip={`${fresh.size} new episode${fresh.size > 1 ? 's' : ''}`} />}</NavLink>
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
            <Icon name="settings" size={18} />
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
        <NavLink to="/" end><Icon name="home" size={18} /><span>Home</span></NavLink>
        <NavLink to="/search"><Icon name="search" size={18} /><span>Search</span></NavLink>
        <NavLink to="/movies"><Icon name="film" size={18} /><span>Movies</span></NavLink>
        <NavLink to="/tv"><Icon name="tv" size={18} /><span>TV</span></NavLink>
        <NavLink to="/live"><Icon name="live" size={18} /><span>Live</span></NavLink>
        <NavLink to="/list"><Icon name="bookmark" size={18} /><span>Library</span>{fresh.size > 0 && <i className="nav-dot" />}</NavLink>
      </nav>
    </>
  );
}
