import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import DiscordIcon from '../components/DiscordIcon';
import { DISCORD_URL } from '../lib/links';

const EMAIL = (import.meta.env.VITE_CONTACT_EMAIL as string | undefined)?.trim() ?? '';

export default function Contact() {
  return (
    <main className="page pad-top">
      <div className="container narrow legal">
        <p className="crumb"><Link to="/" className="link"><Icon name="chevronLeft" size={14} />Home</Link></p>
        <h1 className="title">Contact us</h1>
        <p>Questions, feedback, a broken server or a title you'd like to see? Come say hi in our Discord server — it's the fastest way to reach us.</p>
        <a className="contact-card" href={DISCORD_URL} target="_blank" rel="noopener noreferrer" aria-label="Join the Comvie Discord server">
          <DiscordIcon size={64} />
          <span>
            <strong>Comvie on Discord</strong>
          </span>
          <b className="join">Join<Icon name="chevronRight" size={15} /></b>
        </a>
        {EMAIL && (
          <p>
            Prefer email? <a className="link" href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </p>
        )}
        <p className="muted small">For copyright or takedown requests, please use the <Link to="/takedown" className="link">takedown page</Link>.</p>
      </div>
    </main>
  );
}
