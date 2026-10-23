export interface PlayerTick {
  /** Seconds played so far */
  t: number;
  /** Total length in seconds (0 when unknown) */
  d: number;
  /** The video finished */
  ended?: boolean;
}

export interface Provider {
  id: string;
  name: string;
  quality: string;
  /** Works inside a sandboxed frame (popup protection). Some servers refuse to play when sandboxed. */
  sandboxOk: boolean;
  /** `start` = seconds to begin from (0 = from the beginning) */
  movie: (id: number, start?: number) => string;
  tv: (id: number, season: number, episode: number, start?: number) => string;
  /** Reads a progress message posted by this server's player, or null if the message isn't one. */
  parse: (ev: MessageEvent) => PlayerTick | null;
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** Servers that post `{ type: 'PLAYER_EVENT', data: { event, currentTime, duration } }` */
const playerEvent = (ev: MessageEvent, hostOk: (host: string) => boolean): PlayerTick | null => {
  let host = '';
  try {
    host = new URL(ev.origin).hostname;
  } catch {
    return null;
  }
  if (!hostOk(host)) return null;
  const m = ev.data;
  if (!m || m.type !== 'PLAYER_EVENT' || !m.data) return null;
  const e = m.data.event;
  if (e === 'ended') return { t: 0, d: 0, ended: true };
  if (e === 'timeupdate' || e === 'pause' || e === 'seeked') return { t: num(m.data.currentTime), d: num(m.data.duration) };
  return null;
};

export const providers: Provider[] = [
  {
    id: 'cinesrc',
    name: 'Server 1',
    quality: '1080p Ultra',
    sandboxOk: true,
    movie: (id, start = 0) =>
      `https://cinesrc.st/embed/movie/${id}${start > 0 ? `?t=${start}&continueprompt=false` : ''}`,
    tv: (id, s, e, start = 0) =>
      `https://cinesrc.st/embed/tv/${id}?s=${s}&e=${e}${start > 0 ? `&t=${start}&continueprompt=false` : ''}`,
    parse: (ev) => {
      if (ev.origin !== 'https://cinesrc.st') return null;
      const m = ev.data;
      if (!m || typeof m.type !== 'string') return null;
      if (m.type === 'cinesrc:ended') return { t: 0, d: 0, ended: true };
      if (m.type === 'cinesrc:timeupdate' || m.type === 'cinesrc:pause' || m.type === 'cinesrc:seeked')
        return { t: num(m.currentTime), d: num(m.duration) };
      return null;
    }
  },
  {
    id: 'vidlink',
    name: 'Server 2',
    quality: '1080p HD',
    sandboxOk: false,
    movie: (id, start = 0) =>
      `https://vidlink.pro/movie/${id}?primaryColor=ff6b57&autoplay=true${start > 0 ? `&startAt=${start}` : ''}`,
    tv: (id, s, e, start = 0) =>
      `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=ff6b57&autoplay=true${start > 0 ? `&startAt=${start}` : ''}`,
    parse: (ev) => playerEvent(ev, (h) => h === 'vidlink.pro' || h.endsWith('.vidlink.pro'))
  },
  {
    id: 'vidfast',
    name: 'Server 3',
    quality: '1080p Pro',
    sandboxOk: false,
    movie: (id, start = 0) => `https://vidfast.vc/movie/${id}?autoPlay=true${start > 0 ? `&startAt=${start}` : ''}`,
    tv: (id, s, e, start = 0) =>
      `https://vidfast.vc/tv/${id}/${s}/${e}?autoPlay=true${start > 0 ? `&startAt=${start}` : ''}`,
    parse: (ev) => playerEvent(ev, (h) => h.startsWith('vidfast.') || h.includes('.vidfast.'))
  }
];

export const providerById = (id: string | null | undefined): Provider =>
  providers.find((p) => p.id === id) ?? providers[0];
