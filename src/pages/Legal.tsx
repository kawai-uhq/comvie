import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

const EMAIL = (import.meta.env.VITE_CONTACT_EMAIL as string | undefined)?.trim() ?? '';

function Contact() {
  return EMAIL ? (
    <a className="link" href={`mailto:${EMAIL}`}>{EMAIL}</a>
  ) : (
    <a className="link" href="https://github.com/kawai-uhq/comvie/issues" target="_blank" rel="noopener noreferrer">our GitHub issues page</a>
  );
}

function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="page pad-top">
      <div className="container narrow legal">
        <p className="crumb"><Link to="/" className="link">‹ Home</Link></p>
        <h1 className="title">{title}</h1>
        {children}
        <p className="muted small">Last updated: October 2026.</p>
      </div>
    </main>
  );
}

export function About() {
  return (
    <Page title="About Comvie">
      <p>Comvie (comfy + movie) is a cosy place to browse trending movies, TV shows and anime, keep a list of what you want to watch, and pick up where you left off.</p>
      <h2>What Comvie is, and isn't</h2>
      <ul>
        <li>Titles, posters, descriptions, cast and trailers come from <strong>TMDB</strong> and YouTube. This product uses the TMDB API but is not endorsed or certified by TMDB.</li>
        <li><strong>Comvie does not host, store or upload any video files.</strong> When you press Play, the site opens a player provided by a third party. What that player shows is controlled by its owner.</li>
        <li>Live TV lists free, publicly available channels gathered from an open public directory. Channels can go offline or be blocked in your region at any time.</li>
      </ul>
      <h2>Contact</h2>
      <p>Questions or feedback: <Contact />.</p>
    </Page>
  );
}

export function Terms() {
  return (
    <Page title="Terms of use">
      <p>By using Comvie you agree to these terms. If you don't agree, please don't use the site.</p>
      <h2>Using the site</h2>
      <ul>
        <li>Comvie is provided for personal, non-commercial use.</li>
        <li>You are responsible for following the laws of your country, including copyright law, when you watch anything through a third-party player.</li>
        <li>Don't try to break, overload or scrape the site, or use it to harm others.</li>
      </ul>
      <h2>Third-party content</h2>
      <p>Players, channels, trailers and images come from outside services. Comvie doesn't control them, can't guarantee they work, and isn't responsible for what they show or how they behave, including ads or popups.</p>
      <h2>No warranty</h2>
      <p>Comvie is provided "as is", without promises that it will always be available, accurate or error-free. To the extent the law allows, we are not liable for losses from using the site.</p>
      <h2>Accounts</h2>
      <p>Accounts are optional. You are responsible for the email address you sign in with. We may suspend accounts that abuse the service.</p>
      <h2>Changes</h2>
      <p>We may update these terms. Continuing to use the site means you accept the updated terms.</p>
      <h2>Contact</h2>
      <p><Contact /></p>
    </Page>
  );
}

export function Privacy() {
  return (
    <Page title="Privacy">
      <p>Comvie is built to collect as little as possible. We don't show ads and don't run our own analytics or trackers.</p>
      <h2>Stored on your device</h2>
      <p>Your Watchlist, Favorites, Continue Watching, favorite and recent channels, and settings are saved in your browser's local storage. Clearing your browser data removes them.</p>
      <h2>If you sign in (optional)</h2>
      <p>We store your email address and the lists above on our database provider, Supabase, so they follow you between devices. Sign-in uses a one-time code sent to your email, and there are no passwords. To delete your account and data, contact <Contact />.</p>
      <h2>Outside services you connect to</h2>
      <ul>
        <li><strong>TMDB</strong> provides titles and pictures. Your browser loads images directly from TMDB's servers, so TMDB can see your IP address.</li>
        <li><strong>Third-party players</strong> and <strong>YouTube</strong> (trailers, loaded in privacy-enhanced mode) run their own code and may set cookies or collect data under their own policies.</li>
        <li><strong>The public channel directory</strong> and each TV channel's stream host are contacted when you use Live TV.</li>
        <li><strong>Vercel</strong> hosts the site and keeps standard server logs.</li>
      </ul>
      <h2>Contact</h2>
      <p><Contact /></p>
    </Page>
  );
}

export function Takedown() {
  return (
    <Page title="Takedown requests">
      <p>Comvie does not host or upload video. Playback comes from third-party players. We still take rights holders' concerns seriously.</p>
      <h2>If you own rights to a title</h2>
      <p>Contact <Contact /> with:</p>
      <ul>
        <li>Your name, company and contact details.</li>
        <li>The work you own, and proof or a description of your rights.</li>
        <li>The Comvie page address(es) involved.</li>
        <li>A statement that you believe in good faith that the use is not authorised, and that your information is accurate.</li>
      </ul>
      <p>After review we will, where appropriate, disable playback for that title on Comvie. We can't remove content from the third-party players themselves, so please also contact the service that actually hosts the video.</p>
    </Page>
  );
}
