export interface Provider {
  id: string;
  name: string;
  quality: string;
  movie: (id: number) => string;
  tv: (id: number, season: number, episode: number) => string;
}

export const providers: Provider[] = [
  {
    id: 'cinesrc',
    name: 'Server 1',
    quality: '1080p Ultra',
    movie: (id) => `https://cinesrc.st/embed/movie/${id}`,
    tv: (id, s, e) => `https://cinesrc.st/embed/tv/${id}?s=${s}&e=${e}`
  },
  {
    id: 'vidlink',
    name: 'Server 2',
    quality: '1080p HD',
    movie: (id) => `https://vidlink.pro/movie/${id}`,
    tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`
  },
  {
    id: 'vidfast',
    name: 'Server 3',
    quality: '1080p Pro',
    movie: (id) => `https://vidfast.vc/movie/${id}?autoPlay=true`,
    tv: (id, s, e) => `https://vidfast.vc/tv/${id}/${s}/${e}?autoPlay=true`
  }
];

export const providerById = (id: string | null | undefined): Provider =>
  providers.find((p) => p.id === id) ?? providers[0];
