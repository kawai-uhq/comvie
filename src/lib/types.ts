export type MediaType = 'movie' | 'tv';

export interface Media {
  id: number;
  title: string;
  poster: string | null;
  backdrop: string | null;
  overview: string;
  type: MediaType;
  rating: number;
  year: string;
}

export const mediaKey = (m: Media) => `${m.type}:${m.id}`;

export interface Season {
  number: number;
  name: string;
  episodeCount: number;
}

export interface Episode {
  number: number;
  name: string;
  overview: string;
  still: string | null;
  rating: number;
  runtime: number;
}

export interface Details {
  media: Media;
  genres: string[];
  runtime: number;
  tagline: string;
  seasons: Season[];
}

export interface WatchEntry {
  media: Media;
  season: number | null;
  episode: number | null;
  providerId: string;
  watchedAt: number;
}

export const progressLabel = (w: WatchEntry) =>
  w.media.type === 'tv' && w.season && w.episode ? `S${w.season} · E${w.episode}` : 'Movie';

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  email: string;
}
