import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { REPORT_ISSUES, sendReport } from '../lib/report';
import Icon from './Icon';

/** "Report a problem" form on the player page. Goes to the team's Discord; replies show up in My Library → Reports. */
export default function ReportModal({
  onClose,
  title,
  type,
  id,
  season,
  episode,
  server
}: {
  onClose: () => void;
  title: string;
  type: 'movie' | 'tv';
  id: number;
  season?: number;
  episode?: number;
  server: string;
}) {
  const [issue, setIssue] = useState(REPORT_ISSUES[0]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      setDoneId(await sendReport({ title, type, id, season, episode, server, issue, note }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send the report.");
    }
    setBusy(false);
  };

  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="modal report" role="dialog" aria-modal="true" aria-label="Report a problem">
        <button className="modal-close" aria-label="Close" onClick={onClose} disabled={busy}><Icon name="x" size={16} /></button>
        {doneId ? (
          <>
            <div className="auth-icon"><Icon name="check" size={24} /></div>
            <h2>Report sent</h2>
            <p className="muted">Thanks! Your report ID is <b>#{doneId}</b>. If the team replies, you'll see the answer under <Link to="/list?tab=reports" className="link" onClick={onClose}>My Library → Reports</Link>.</p>
            <button className="btn primary wide" onClick={onClose}>Done</button>
          </>
        ) : (
          <>
            <h2>Report a problem</h2>
            <p className="muted small">{title}{season ? ` · S${season} E${episode}` : ''} · {server}</p>
            <div className="report-issues" role="radiogroup" aria-label="What went wrong?">
              {REPORT_ISSUES.map((i) => (
                <button key={i} role="radio" aria-checked={issue === i} className={`pill ${issue === i ? 'on' : ''}`} onClick={() => setIssue(i)}>{i}</button>
              ))}
            </div>
            <textarea
              className="field report-note"
              placeholder="Anything else we should know? (optional)"
              maxLength={300}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            {error && <p className="error">{error}</p>}
            <button className="btn primary wide" disabled={busy} onClick={() => void submit()}>{busy ? 'Sending…' : 'Send report'}</button>
          </>
        )}
      </div>
    </div>
  );
}
