import { useEffect, useMemo, useState } from 'react';
import { tmdb } from './tmdb';
import { mediaKey } from './types';
import { isWatched } from './progress';
import { useApp } from '../state';

const DAY = 86_400_000;
const FRESH_DAYS = 14;
const MAX_CHECK = 25;

/**
 * Keys ("tv:123") of series in the Watchlist or Favorites that aired a new episode in the last two weeks
 * and that you haven't watched yet.
 */
export function useNewEpisodes(): Set<string> {
  const { favorites, loved, history } = useApp();
  const [fresh, setFresh] = useState<Set<string>>(() => new Set());

  const shows = useMemo(() => {
    const seen = new Set<string>();
    return [...favorites, ...loved]
      .filter((m) => {
        const k = mediaKey(m);
        if (m.type !== 'tv' || seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, MAX_CHECK);
  }, [favorites, loved]);

  const idKey = shows.map(mediaKey).join(',');

  useEffect(() => {
    if (!shows.length) {
      setFresh(new Set());
      return;
    }
    let live = true;
    // Wait a moment so this never competes with the page that is loading
    const t = window.setTimeout(() => {
      Promise.all(
        shows.map((m) =>
          tmdb
            .details('tv', m.id)
            .then((d) => ({ m, la: d.lastAired }))
            .catch(() => ({ m, la: null }))
        )
      ).then((rows) => {
        if (!live) return;
        const out = new Set<string>();
        for (const { m, la } of rows) {
          if (!la) continue;
          const age = Date.now() - new Date(la.date).getTime();
          if (!(age >= 0 && age < FRESH_DAYS * DAY)) continue;
          const w = history.find((h) => mediaKey(h.media) === mediaKey(m));
          const seenIt = w?.season != null && w.episode != null && (w.season > la.season || (w.season === la.season && w.episode >= la.episode));
          if (!seenIt && !isWatched('tv', m.id, la.season, la.episode)) out.add(mediaKey(m));
        }
        setFresh(out);
      });
    }, 1500);
    return () => {
      live = false;
      window.clearTimeout(t);
    };
    // shows are identified by idKey; history decides whether the episode was already seen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idKey, history]);

  return fresh;
}
