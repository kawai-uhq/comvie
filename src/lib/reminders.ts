import { useEffect, useState } from 'react';
import { store } from './storage';
import type { Reminder } from './storage';
import { mediaKey } from './types';
import type { Media } from './types';

const EVT = 'comvie:reminders';
const today = () => new Date().toISOString().slice(0, 10);

const emit = () => window.dispatchEvent(new Event(EVT));

export function toggleReminder(m: Media, date: string) {
  const k = mediaKey(m);
  const cur = store.getReminders();
  const has = cur.some((r) => mediaKey(r.media) === k);
  store.saveReminders(has ? cur.filter((r) => mediaKey(r.media) !== k) : [{ media: m, date }, ...cur].slice(0, 100));
  emit();
}

export function dropReminder(m: Media) {
  const cur = store.getReminders();
  const next = cur.filter((r) => mediaKey(r.media) !== mediaKey(m));
  if (next.length !== cur.length) {
    store.saveReminders(next);
    emit();
  }
}

/** Reminders (soonest first) plus how many have already reached their release date. */
export function useReminders() {
  const [list, setList] = useState<Reminder[]>(() => store.getReminders());
  useEffect(() => {
    const on = () => setList(store.getReminders());
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);
  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
  const due = sorted.filter((r) => r.date <= today()).length;
  return { list: sorted, due, has: (m: Media) => list.some((r) => mediaKey(r.media) === mediaKey(m)) };
}
