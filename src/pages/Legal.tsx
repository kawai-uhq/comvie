import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

const EMAIL = (import.meta.env.VITE_CONTACT_EMAIL as string | undefined)?.trim() ?? '';
const UPDATED = 'October 24, 2026';

function Reach() {
  return (
    <>
      <Link className="link" to="/contact">our Contact page</Link>
      {EMAIL && (
        <>
          {' '}or <a className="link" href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </>
      )}
    </>
  );
}

/** The shared row of links under every help / legal page */
export function PolicyLinks() {
  return (
    <nav className="policy-links" aria-label="Help and legal">
      <Link to="/help">Get help</Link>
      <Link to="/legal/terms">Terms</Link>
      <Link to="/legal/privacy">Privacy</Link>
      <Link to="/legal/dmca">DMCA</Link>
      <Link to="/contact">Contact</Link>
    </nav>
  );
}

function Page({ title, updated = true, children }: { title: string; updated?: boolean; children: ReactNode }) {
  return (
    <main className="page pad-top">
      <div className="container narrow legal">
        <p className="crumb"><Link to="/" className="link"><Icon name="chevronLeft" size={14} />Home</Link></p>
        <h1 className="title">{title}</h1>
        {updated && <p className="muted small lupdated">Last updated: {UPDATED}</p>}
        {children}
        <PolicyLinks />
      </div>
    </main>
  );
}

function Sec({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="lsec">
      <h2><span className="lnum">{n}</span>{title}</h2>
      {children}
    </section>
  );
}

function Notice() {
  return (
    <p className="lnotice">
      <Icon name="info" size={16} />
      <span><b>Comvie does not host, upload, or store any files.</b> Titles are indexed automatically from public sources and third-party services, and Comvie only provides links.</span>
    </p>
  );
}

export function About() {
  return (
    <Page title="About Comvie" updated={false}>
      <p>Comvie (comfy + movie) is a cosy place to browse trending movies, TV shows and anime, keep a list of what you want to watch, and pick up where you left off.</p>
      <h2>What Comvie is, and isn't</h2>
      <ul>
        <li>Titles, posters, descriptions, cast and trailers come from <strong>TMDB</strong> and YouTube. This product uses the TMDB API but is not endorsed or certified by TMDB.</li>
        <li><strong>Comvie does not host, store or upload any video files.</strong> When you press Play, the site opens a player provided by a third party. What that player shows is controlled by its owner.</li>
        <li>Live TV lists free, publicly available channels gathered from an open public directory. Channels can go offline or be blocked in your region at any time.</li>
      </ul>
      <h2>Contact</h2>
      <p>Questions or feedback: <Reach />.</p>
    </Page>
  );
}

export function Terms() {
  return (
    <Page title="Terms of Service">
      <Sec n={1} title="Nature of the Service">
        <p><b>Comvie is an automated search and indexing tool.</b> It gathers titles, artwork and information from public sources and links to players run by third parties. Comvie does not host or control the videos you play, and it can't check whether content on a third-party server is licensed.</p>
      </Sec>
      <Sec n={2} title="Your responsibility">
        <p>You use third-party content <b>at your own risk</b>, for personal, non-commercial entertainment. You are responsible for following the laws where you live, including copyright law. Comvie isn't liable for infringement, malware, popups or other harm that comes from third-party players or sites.</p>
      </Sec>
      <Sec n={3} title="Accounts">
        <p>Accounts are optional. If you create one, keep your sign-in details safe and don't share them. We may suspend accounts that abuse the service, try to break or overload it, or try to reverse-engineer how it works.</p>
      </Sec>
      <Sec n={4} title="Intellectual property">
        <p>Comvie's design, name, code and original assets belong to Comvie. Posters, backdrops, cast photos and descriptions belong to their owners and come from services such as TMDB. Nothing here gives you rights to them.</p>
      </Sec>
      <Sec n={5} title="No warranty">
        <p>Comvie is provided "as is". We don't promise it will always be available, accurate or error-free, and, as far as the law allows, we aren't liable for losses from using it.</p>
      </Sec>
      <Sec n={6} title="Changes to these terms">
        <p>We may update these terms at any time. If you keep using Comvie after a change, you accept the new terms.</p>
      </Sec>
      <Notice />
    </Page>
  );
}

export function Privacy() {
  return (
    <Page title="Privacy Policy">
      <p>Comvie is built to collect as little as possible. There are no ads, and we don't run our own analytics or trackers.</p>
      <Sec n={1} title="Kept on your device">
        <p>Your Watchlist, Favorites, watch history, playback positions, watched marks, reminders, recent searches, favorite channels and settings are saved in your browser's local storage on this device. Clearing your browser data removes them.</p>
      </Sec>
      <Sec n={2} title="If you create an account (optional)">
        <p>We store your email address, your sign-in credentials (handled by our authentication provider, Supabase) and your Watchlist, Favorites and watch history, so they follow you between devices. To delete your account and its data, reach us through <Reach />.</p>
      </Sec>
      <Sec n={3} title="Outside services you connect to">
        <ul>
          <li><b>TMDB</b> provides titles and pictures. Your browser loads images straight from TMDB's servers, so TMDB can see your IP address.</li>
          <li><b>Third-party players</b> and <b>YouTube</b> (trailers, in privacy-enhanced mode) run their own code and may set cookies or collect data under their own policies.</li>
          <li><b>Live TV</b> contacts an open public channel directory and each channel's stream host.</li>
          <li><b>Vercel</b> hosts Comvie and keeps standard server logs.</li>
        </ul>
      </Sec>
      <Sec n={4} title="Your choices">
        <p>You can use Comvie without an account, clear your local data from your browser at any time, and turn on popup protection in Settings to block popups from players that support it.</p>
      </Sec>
      <Sec n={5} title="Contact">
        <p>Privacy questions: <Reach />.</p>
      </Sec>
    </Page>
  );
}

export function Dmca() {
  return (
    <Page title="DMCA Notice">
      <p>Comvie is an automated search engine and metadata aggregator. It does not store, stream or upload video or copyrighted files on its own servers.</p>
      <Sec n={1} title="Automated third-party indexing">
        <p>Streams shown on Comvie come from unaffiliated third-party players. Comvie works like a directory that links to content already available on the public internet. Because the files live on other servers, Comvie can't delete them from the internet.</p>
      </Sec>
      <Sec n={2} title="Copyright infringement and removal">
        <p>We respect intellectual property rights. If you're a copyright owner, or you act for one, and you believe a Comvie link or embedded player infringes your work, you can ask us to remove it. For valid requests we will disable playback for that title on Comvie.</p>
        <p>Removing a link doesn't remove the file itself, which stays with whoever hosts it. To have it taken down completely, you also need to contact the hosting provider or server administrator.</p>
      </Sec>
      <Sec n={3} title="Submitting a notice">
        <p>Send your notice through <Reach />. Please include:</p>
        <ul>
          <li>The exact Comvie page address where the link or player appears.</li>
          <li>Details that identify the copyrighted work.</li>
          <li>Proof that you own the rights or are allowed to act for the owner.</li>
          <li>Your name and contact details, and a statement that you believe in good faith the use isn't authorised and that your information is accurate.</li>
        </ul>
      </Sec>
      <Notice />
    </Page>
  );
}
