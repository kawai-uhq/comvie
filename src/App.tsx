import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import AuthModal from './components/AuthModal';
import Navbar from './components/Navbar';
import Detail from './pages/Detail';
import GenreResults from './pages/GenreResults';
import Genres from './pages/Genres';
import Explore from './pages/Explore';
import Tooltip from './components/Tooltip';
import Floating from './components/Floating';
import Footer from './components/Footer';
import Home from './pages/Home';
import { About, Privacy, Takedown, Terms } from './pages/Legal';
import Live from './pages/Live';
import PersonPage from './pages/Person';
import MyList from './pages/MyList';
import Search from './pages/Search';
import Settings from './pages/Settings';
import Watch from './pages/Watch';

export default function App() {
  const { pathname } = useLocation();
  const watching = pathname.startsWith('/watch/');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      {!watching && <Navbar />}
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
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/takedown" element={<Takedown />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/title/:type/:id" element={<Detail />} />
        <Route path="/watch/:type/:id" element={<Watch />} />
        <Route path="*" element={<Home />} />
      </Routes>
      {!watching && <Footer />}
      {!watching && <Floating />}
      <AuthModal />
      <Tooltip />
    </>
  );
}
