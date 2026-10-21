import type { MediaType } from './types';

export interface Genre {
  id: number;
  name: string;
  hue: number;
}

export const movieGenres: Genre[] = [
  { id: 28, name: 'Action', hue: 8 },
  { id: 12, name: 'Adventure', hue: 28 },
  { id: 16, name: 'Animation', hue: 290 },
  { id: 35, name: 'Comedy', hue: 48 },
  { id: 80, name: 'Crime', hue: 350 },
  { id: 99, name: 'Documentary', hue: 170 },
  { id: 18, name: 'Drama', hue: 320 },
  { id: 10751, name: 'Family', hue: 140 },
  { id: 14, name: 'Fantasy', hue: 265 },
  { id: 36, name: 'History', hue: 35 },
  { id: 27, name: 'Horror', hue: 0 },
  { id: 10402, name: 'Music', hue: 200 },
  { id: 9648, name: 'Mystery', hue: 240 },
  { id: 10749, name: 'Romance', hue: 335 },
  { id: 878, name: 'Science Fiction', hue: 190 },
  { id: 10770, name: 'TV Movie', hue: 60 },
  { id: 53, name: 'Thriller', hue: 15 },
  { id: 10752, name: 'War', hue: 100 },
  { id: 37, name: 'Western', hue: 40 }
];

export const tvGenres: Genre[] = [
  { id: 10759, name: 'Action & Adventure', hue: 8 },
  { id: 16, name: 'Animation', hue: 290 },
  { id: 35, name: 'Comedy', hue: 48 },
  { id: 80, name: 'Crime', hue: 350 },
  { id: 99, name: 'Documentary', hue: 170 },
  { id: 18, name: 'Drama', hue: 320 },
  { id: 10751, name: 'Family', hue: 140 },
  { id: 10762, name: 'Kids', hue: 120 },
  { id: 9648, name: 'Mystery', hue: 240 },
  { id: 10763, name: 'News', hue: 210 },
  { id: 10764, name: 'Reality', hue: 25 },
  { id: 10765, name: 'Sci-Fi & Fantasy', hue: 190 },
  { id: 10766, name: 'Soap', hue: 335 },
  { id: 10767, name: 'Talk', hue: 55 },
  { id: 10768, name: 'War & Politics', hue: 100 },
  { id: 37, name: 'Western', hue: 40 }
];

export const genresFor = (t: MediaType) => (t === 'tv' ? tvGenres : movieGenres);
export const findGenre = (t: MediaType, id: number) => genresFor(t).find((g) => g.id === id);

const ICONS: Record<number, string> = {
  28: '⚔️', 12: '🧭', 16: '✨', 35: '😄', 80: '🛡️', 99: '🎥', 18: '🎭', 10751: '👪', 14: '🪄', 36: '🏛️',
  27: '👻', 10402: '🎵', 9648: '🔍', 10749: '❤️', 878: '🚀', 10770: '📺', 53: '🔥', 10752: '💣', 37: '🌵',
  10759: '🗡️', 10762: '🧸', 10763: '📰', 10764: '📷', 10765: '🚀', 10766: '📺', 10767: '💬', 10768: '🏢'
};
export const genreIcon = (id: number) => ICONS[id] ?? '🎬';
