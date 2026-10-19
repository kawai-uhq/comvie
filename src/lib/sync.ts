import { supabaseBase, supabaseKey } from './auth';
import { MAX_HISTORY } from './storage';
import { mediaKey } from './types';
import type { Media, WatchEntry } from './types';

export interface CloudData {
  favorites: Media[];
  history: WatchEntry[];
}

async function rest(
  method: string,
  path: string,
  token: string,
  body?: unknown,
  prefer?: string
): Promise<Response> {
  return fetch(`${supabaseBase}/rest/v1${path}`, {
    method,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {})
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
}

const toJson = (m: Media) => ({
  id: m.id,
  title: m.title,
  poster: m.poster ?? '',
  backdrop: m.backdrop ?? '',
  overview: m.overview,
  type: m.type,
  rating: m.rating,
  year: m.year
});

const fromJson = (o: any): Media => ({
  id: o.id,
  title: o.title ?? '',
  poster: o.poster || null,
  backdrop: o.backdrop || null,
  overview: o.overview ?? '',
  type: o.type === 'tv' ? 'tv' : 'movie',
  rating: Number(o.rating) || 0,
  year: o.year ?? ''
});

const UPSERT = 'resolution=merge-duplicates,return=minimal';

export async function fetchCloud(token: string): Promise<CloudData | null> {
  const [fav, hist] = await Promise.all([
    rest('GET', '/favorites?select=media&order=created_at.desc', token),
    rest(
      'GET',
      `/watch_history?select=media,season,episode,provider_id,watched_at&order=watched_at.desc&limit=${MAX_HISTORY}`,
      token
    )
  ]);
  if (!fav.ok || !hist.ok) return null;
  const favRows = (await fav.json()) as any[];
  const histRows = (await hist.json()) as any[];
  return {
    favorites: favRows.filter((r) => r.media).map((r) => fromJson(r.media)),
    history: histRows
      .filter((r) => r.media)
      .map((r) => ({
        media: fromJson(r.media),
        season: r.season > 0 ? r.season : null,
        episode: r.episode > 0 ? r.episode : null,
        providerId: r.provider_id || 'cinesrc',
        watchedAt: Number(r.watched_at) || 0
      }))
  };
}

export const upsertFavorites = (token: string, list: Media[]) =>
  rest(
    'POST',
    '/favorites?on_conflict=user_id,media_key',
    token,
    list.map((m) => ({ media_key: mediaKey(m), media: toJson(m) })),
    UPSERT
  );

export const upsertHistory = (token: string, list: WatchEntry[]) =>
  rest(
    'POST',
    '/watch_history?on_conflict=user_id,media_key',
    token,
    list.map((w) => ({
      media_key: mediaKey(w.media),
      media: toJson(w.media),
      season: w.season,
      episode: w.episode,
      provider_id: w.providerId,
      watched_at: w.watchedAt
    })),
    UPSERT
  );

export const deleteFavorite = (token: string, key: string) =>
  rest('DELETE', `/favorites?media_key=eq.${encodeURIComponent(key)}`, token);

export const deleteWatch = (token: string, key: string) =>
  rest('DELETE', `/watch_history?media_key=eq.${encodeURIComponent(key)}`, token);
