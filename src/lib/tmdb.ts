import type { CastMember, Details, Episode, Media, MediaType, Person } from './types';

export const IMG = {
  card: 'https://image.tmdb.org/t/p/w342',
  large: 'https://image.tmdb.org/t/p/w780',
  original: 'https://image.tmdb.org/t/p/original',
  still: 'https://image.tmdb.org/t/p/w300'
};

const B = 'https://image.tmdb.org/t/p/';
/** Responsive image helpers: the browser picks the smallest file that looks sharp. */
export const posterSrc = (p: string) => `${B}w342${p}`;
export const posterSet = (p: string) => `${B}w185${p} 185w, ${B}w342${p} 342w, ${B}w500${p} 500w`;
export const backdropSrc = (p: string) => `${B}w1280${p}`;
export const backdropSet = (p: string) => `${B}w780${p} 780w, ${B}w1280${p} 1280w, ${B}original${p} 1920w`;
export const profileSrc = (p: string) => `${B}w185${p}`;

const cache = new Map<string, Promise<any>>();

function get(path: string): Promise<any> {
  const hit = cache.get(path);
  if (hit) return hit;
  const p = (async () => {
    let r: Response;
    try {
      r = await fetch('/api/tmdb?path=' + encodeURIComponent(path));
    } catch {
      throw new Error("Can't reach the server. Check your internet connection.");
    }
    if (!r.ok) {
      let msg = '';
      try {
        msg = (await r.json()).error ?? '';
      } catch {
        /* not json */
      }
      throw new Error(msg || `Something went wrong (${r.status}).`);
    }
    return r.json();
  })();
  cache.set(path, p);
  p.catch(() => cache.delete(path));
  return p;
}

function parse(o: any, fallback: 'all' | MediaType): Media | null {
  if (!o) return null;
  const type = fallback === 'all' ? o.media_type : fallback;
  if (type !== 'movie' && type !== 'tv') return null;
  const date: string = (type === 'movie' ? o.release_date : o.first_air_date) ?? '';
  return {
    id: o.id,
    title: (type === 'movie' ? o.title : o.name) || 'Untitled',
    poster: o.poster_path || null,
    backdrop: o.backdrop_path || null,
    overview: o.overview ?? '',
    type,
    rating: o.vote_average ?? 0,
    year: date.slice(0, 4)
  };
}

const list = (json: any, fb: 'all' | MediaType): Media[] =>
  ((json?.results ?? []) as any[]).map((o) => parse(o, fb)).filter((m): m is Media => m !== null);

export const tmdb = {
  trending: () => get('/trending/all/day?language=en-US').then((j) => list(j, 'all')),
  popular: (t: MediaType) => get(`/${t}/popular?language=en-US&page=1`).then((j) => list(j, t)),
  topRated: (t: MediaType) => get(`/${t}/top_rated?language=en-US&page=1`).then((j) => list(j, t)),
  search: (q: string) => {
    // encodeURIComponent leaves ! ' ( ) * ~ alone; encode them too so every title is safe to send
    const enc = encodeURIComponent(q).replace(/[!'()*~]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
    return get(`/search/multi?query=${enc}&include_adult=false&language=en-US&page=1`).then((j) => list(j, 'all'));
  },
  anime: () =>
    get(
      '/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc&language=en-US&page=1'
    ).then((j) => list(j, 'tv')),
  discover: (t: MediaType, genre: number, page: number) =>
    get(
      `/discover/${t}?with_genres=${genre}&sort_by=popularity.desc&include_adult=false&language=en-US&page=${page}`
    ).then((j) => ({ items: list(j, t), pages: (j?.total_pages as number) || 1 })),
  similar: async (t: MediaType, id: number) => {
    const rec = await get(`/${t}/${id}/recommendations?language=en-US&page=1`).then((j) => list(j, t));
    if (rec.length) return rec;
    return get(`/${t}/${id}/similar?language=en-US&page=1`).then((j) => list(j, t));
  },
  details: async (t: MediaType, id: number): Promise<Details> => {
    const j = await get(`/${t}/${id}?language=en-US`);
    const media = parse(j, t);
    if (!media) throw new Error('Title not found.');
    const la = j.last_episode_to_air;
    return {
      media,
      lastAired:
        la?.air_date && la.season_number
          ? { season: la.season_number as number, episode: la.episode_number as number, date: la.air_date as string }
          : null,
      genres: ((j.genres ?? []) as any[]).map((g) => g.name as string),
      runtime: j.runtime || j.episode_run_time?.[0] || 0,
      tagline: j.tagline ?? '',
      seasons: ((j.seasons ?? []) as any[])
        .filter((s) => s.season_number > 0)
        .map((s) => ({
          number: s.season_number as number,
          name: (s.name as string) || `Season ${s.season_number}`,
          episodeCount: (s.episode_count as number) ?? 0
        }))
    };
  },
  trailer: async (t: MediaType, id: number): Promise<string | null> => {
    const j = await get(`/${t}/${id}/videos?language=en-US`);
    const vids = ((j?.results ?? []) as any[]).filter((v) => v.site === 'YouTube' && /^[\w-]{6,20}$/.test(v.key));
    const pick =
      vids.find((v) => v.type === 'Trailer' && v.official) ??
      vids.find((v) => v.type === 'Trailer') ??
      vids.find((v) => v.type === 'Teaser');
    return (pick?.key as string | undefined) ?? null;
  },
  credits: async (t: MediaType, id: number): Promise<{ cast: CastMember[]; directors: string[] }> => {
    const j = await get(`/${t}/${id}/credits?language=en-US`);
    return {
      cast: ((j?.cast ?? []) as any[]).slice(0, 20).map((c) => ({
        id: c.id as number,
        name: c.name as string,
        character: (c.character as string) || '',
        photo: (c.profile_path as string) || null
      })),
      directors: ((j?.crew ?? []) as any[]).filter((c) => c.job === 'Director').map((c) => c.name as string)
    };
  },
  person: async (id: number): Promise<{ person: Person; knownFor: Media[] }> => {
    const [p, c] = await Promise.all([
      get(`/person/${id}?language=en-US`),
      get(`/person/${id}/combined_credits?language=en-US`)
    ]);
    const seen = new Set<string>();
    const knownFor = ((c?.cast ?? []) as any[])
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
      .map((o) => parse(o, 'all'))
      .filter((m): m is Media => {
        if (!m) return false;
        const k = `${m.type}:${m.id}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, 40);
    return {
      person: {
        id,
        name: p.name ?? '',
        bio: p.biography ?? '',
        photo: p.profile_path || null,
        born: p.birthday ?? '',
        place: p.place_of_birth ?? '',
        knownFor: p.known_for_department ?? ''
      },
      knownFor
    };
  },
  episodes: async (id: number, season: number): Promise<Episode[]> => {
    const j = await get(`/tv/${id}/season/${season}?language=en-US`);
    return ((j.episodes ?? []) as any[]).map((e, i) => ({
      number: e.episode_number ?? i + 1,
      name: e.name || `Episode ${i + 1}`,
      overview: e.overview ?? '',
      still: e.still_path || null,
      rating: e.vote_average ?? 0,
      runtime: e.runtime ?? 0
    }));
  }
};
