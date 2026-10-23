import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DISCORD_URL } from '../lib/links';
import { store } from '../lib/storage';
import DiscordIcon from './DiscordIcon';

/** "Join our Discord" ad shown when the site opens, unless the visitor ticked "Don't show again". */
export default function DiscordPopup() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [never, setNever] = useState(false);
  const [shown, setShown] = useState(false);

  // Once per page load, a moment after the site opens. Never over a playing video.
  useEffect(() => {
    if (shown || store.getDiscordHide() || pathname.startsWith('/watch/')) return;
    const h = window.setTimeout(() => {
      setOpen(true);
      setShown(true);
    }, 1500);
    return () => window.clearTimeout(h);
  }, [pathname, shown]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="modal dc-pop" role="dialog" aria-modal="true" aria-label="Join our Discord server">
        <button className="modal-close" aria-label="Close" onClick={() => setOpen(false)}>✕</button>
        <div className="dc-art"><DiscordIcon size={64} /></div>
        <h2>Join our Discord</h2>
        <p className="muted">Hang out with the Comvie community — get updates, share feedback and report anything that isn't working.</p>
        <a className="btn dc-join" href={DISCORD_URL} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
          Join the server
        </a>
        <label className="dc-never">
          <input
            type="checkbox"
            checked={never}
            onChange={(e) => {
              setNever(e.target.checked);
              store.saveDiscordHide(e.target.checked);
            }}
          />
          Don't show this again
        </label>
        <button className="link dc-later" onClick={() => setOpen(false)}>Maybe later</button>
      </div>
    </div>
  );
}
