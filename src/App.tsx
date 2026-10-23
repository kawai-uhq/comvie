import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import AuthModal from './components/AuthModal';
import Navbar from './components/Navbar';
const Detail = lazy(() => import('./pages/Detail'));
const GenreResults = lazy(() => import('./pages/GenreResults'));
const Genres = lazy(() => import('./pages/Genres'));
const Explore = lazy(() => import('./pages/Explore'));
import Tooltip from './components/Tooltip';
import DiscordPopup from './components/DiscordPopup';
import Contact from './pages/Contact';
import Floating from './components/Floating';
import Footer from './components/Footer';
import Home from './pages/Home';
import { About, Privacy, Takedown, Terms } from './pages/Legal';
const Live = lazy(() => import('./pages/Live'));
const PersonPage = lazy(() => import('./pages/Person'));
const MyList = lazy(() => import('./pages/MyList'));
const Search = lazy(() => import('./pages/Search'));
const Settings = lazy(() => import('./pages/Settings'));
const Watch = lazy(() => import('./pages/Watch'));

export default function App() {
  const { pathname } = useLocation();
  const watching = pathname.startsWith('/watch/');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      {!watching && <Navbar />}
      <Suspense fallback={<div className="status" style={{ minHeight: '70vh' }}><div className="spinner" aria-label="Loading" /></div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Explore key="m" kind="movie" />} />
        <Route path="/tv" element={<Explore key="t" kind="tv" />} />
        <Route path="/explore/:feed" element={<Explore key="x" />} />
        <Route path="/search" element={<Search />} />
        <Route path="/genres" element={<Genres />} />
        <Route path="/genres/:type/:id" element={<GenreResults />} />
        <Route path="/live" element={<Live />} />
        <Route path="/list" element={<MyList />} />
        <Route path="/person/:id" element={<PersonPage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/takedown" element={<Takedown />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/title/:type/:id" element={<Detail />} />
        <Route path="/watch/:type/:id" element={<Watch />} />
        <Route path="*" element={<Home />} />
      </Routes>
      </Suspense>
      <Footer />
      {!watching && <Floating />}
      <AuthModal />
      <DiscordPopup />
      <Tooltip />
    </>
  );
}
