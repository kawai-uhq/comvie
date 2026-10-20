// Free public channels from the open iptv-org directory (https://github.com/iptv-org/iptv).
export interface Channel {
  id: string;
  name: string;
  country: string;
  categories: string[];
  logos: string[];
  url: string;
  quality: string | null;
}

const BASE = 'https://iptv-org.github.io/api';
let cache: Promise<Channel[]> | null = null;

async function getJson(file: string): Promise<any> {
  const r = await fetch(`${BASE}/${file}`);
  if (!r.ok) throw new Error(`Couldn't load the channel list (${r.status}).`);
  return r.json();
}

const rank = (q: string | null) => parseInt(q ?? '', 10) || 0;

export function loadChannels(): Promise<Channel[]> {
  if (cache) return cache;
  cache = (async () => {
    let channels: any[], streams: any[], logos: any[];
    try {
      [channels, streams, logos] = await Promise.all([
        getJson('channels.json'),
        getJson('streams.json'),
        getJson('logos.json').catch(() => [])
      ]);
    } catch (e) {
      throw e instanceof Error && e.message.startsWith("Couldn't")
        ? e
        : new Error("Can't reach the channel list. Check your internet connection.");
    }

    // Several logo candidates per channel (many hosts are dead): https first, png/svg/webp first
    const logoOf = new Map<string, string[]>();
    for (const l of logos) {
      if (!l?.channel || !l?.url) continue;
      const list = logoOf.get(l.channel) ?? [];
      if (!list.includes(l.url)) list.push(l.url);
      logoOf.set(l.channel, list);
    }
    const score = (u: string) => (u.startsWith('https://') ? 0 : 2) + (/\.(png|svg|webp)(\?|$)/i.test(u) ? 0 : 1);
    for (const [k, v] of logoOf) logoOf.set(k, v.sort((a, b) => score(a) - score(b)).slice(0, 4));

    // One stream per channel: prefer https, then higher quality
    const best = new Map<string, any>();
    for (const s of streams) {
      if (!s?.channel || !s?.url) continue;
      const cur = best.get(s.channel);
      const secure = String(s.url).startsWith('https://');
      const curSecure = cur ? String(cur.url).startsWith('https://') : false;
      if (!cur || (secure && !curSecure) || (secure === curSecure && rank(s.quality) > rank(cur.quality))) {
        best.set(s.channel, s);
      }
    }

    const out: Channel[] = [];
    for (const c of channels) {
      const s = best.get(c?.id);
      if (!s || c.is_nsfw || c.closed) continue;
      const cats: string[] = Array.isArray(c.categories) ? c.categories : [];
      if (cats.includes('xxx')) continue;
      out.push({
        id: c.id,
        name: c.name,
        country: c.country ?? '',
        categories: cats,
        logos: logoOf.get(c.id) ?? (c.logo ? [c.logo] : []),
        url: s.url,
        quality: s.quality ?? null
      });
    }
    out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
  })();
  cache.catch(() => {
    cache = null;
  });
  return cache;
}

let names: Intl.DisplayNames | null | undefined;
export function countryName(code: string): string {
  if (!code) return 'International';
  if (names === undefined) {
    try {
      names = new Intl.DisplayNames(['en'], { type: 'region' });
    } catch {
      names = null;
    }
  }
  try {
    return names?.of(code) ?? code;
  } catch {
    return code;
  }
}

export function flag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return '🌐';
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
}
