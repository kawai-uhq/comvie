import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import AuthModal from './components/AuthModal';
import Navbar from './components/Navbar';
import Detail from './pages/Detail';
import GenreResults from './pages/GenreResults';
import Genres from './pages/Genres';
import Home from './pages/Home';
import Live from './pages/Live';
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
        <Route path="/search" element={<Search />} />
        <Route path="/genres" element={<Genres />} />
        <Route path="/genres/:type/:id" element={<GenreResults />} />
        <Route path="/live" element={<Live />} />
        <Route path="/list" element={<MyList />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/title/:type/:id" element={<Detail />} />
        <Route path="/watch/:type/:id" element={<Watch />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <AuthModal />
    </>
  );
}
