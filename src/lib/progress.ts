import { store } from './storage';
import type { MediaType } from './types';

const BACK = 5; // start this many seconds before where the viewer stopped
const MAX = 150;

const key = (t: MediaType, id: number, s: number, e: number) => (t === 'tv' ? `tv:${id}:${s}:${e}` : `movie:${id}`);

/** Seconds to start playback from: the saved spot minus 5s, or 0 when there's nothing worth resuming. */
export function resumeAt(t: MediaType, id: number, s: number, e: number): number {
  const p = store.getProgress()[key(t, id, s, e)];
  if (!p || p.t < 15) return 0;
  if (p.d > 0 && p.d - p.t < 60) return 0; // basically finished
  return Math.max(0, Math.floor(p.t) - BACK);
}

export function saveAt(t: MediaType, id: number, s: number, e: number, pos: number, dur: number) {
  if (!(pos > 0)) return;
  const all = store.getProgress();
  all[key(t, id, s, e)] = { t: Math.floor(pos), d: Math.floor(dur), at: Date.now() };
  const k = Object.keys(all);
  if (k.length > MAX) {
    k.sort((a, b) => all[a].at - all[b].at).slice(0, k.length - MAX).forEach((x) => delete all[x]);
  }
  store.saveProgress(all);
}

export function clearAt(t: MediaType, id: number, s: number, e: number) {
  const all = store.getProgress();
  if (delete all[key(t, id, s, e)]) store.saveProgress(all);
}

/** 0–1 fraction watched of one episode (for the little bar on the episode list). */
export function fractionOf(t: MediaType, id: number, s: number, e: number): number {
  const p = store.getProgress()[key(t, id, s, e)];
  return p && p.d > 0 ? Math.min(1, p.t / p.d) : 0;
}

export const clock = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
};

// ---- Watched marks ----
export const isWatched = (t: MediaType, id: number, s: number, e: number) => !!store.getWatched()[key(t, id, s, e)];

export function setWatched(t: MediaType, id: number, s: number, e: number, on: boolean) {
  const all = store.getWatched();
  const k = key(t, id, s, e);
  if (on) all[k] = Date.now();
  else delete all[k];
  store.saveWatched(all);
}

export function setSeasonWatched(id: number, s: number, episodes: number[], on: boolean) {
  const all = store.getWatched();
  for (const e of episodes) {
    const k = key('tv', id, s, e);
    if (on) all[k] = all[k] ?? Date.now();
    else delete all[k];
  }
  store.saveWatched(all);
}
