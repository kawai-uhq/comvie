import { store } from './storage';

export const REPORT_ISSUES = ["Won't load", 'No sound', 'Wrong video', 'Keeps buffering', 'Subtitles problem', 'Something else'];

export interface ReportInput {
  title: string;
  type: 'movie' | 'tv';
  id: number;
  season?: number;
  episode?: number;
  server: string;
  issue: string;
  note: string;
}

/** Sends a "this server isn't working" report to the team's Discord. Resolves with the report ID. */
export async function sendReport(r: ReportInput): Promise<string> {
  const res = await fetch('/api/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...r, rid: store.getRid() })
  });
  const j = (await res.json().catch(() => ({}))) as { id?: string; ref?: string; error?: string };
  if (!res.ok || !j.id) throw new Error(j.error || "Couldn't send the report. Try again in a minute.");
  store.saveReports([{ id: j.id, ref: j.ref, title: r.title, at: Date.now() }, ...store.getReports()].slice(0, 20));
  return j.id;
}

export interface ReportReply {
  text: string;
  at: string;
}

/** Replies the team wrote to one of this visitor's reports (empty until someone answers). */
export async function fetchReplies(ref: string): Promise<ReportReply[] | null> {
  try {
    const res = await fetch(`/api/report-status?ref=${encodeURIComponent(ref)}&rid=${encodeURIComponent(store.getRid())}`);
    if (!res.ok) return null;
    const j = (await res.json()) as { replies?: ReportReply[] };
    return j.replies ?? [];
  } catch {
    return null;
  }
}
