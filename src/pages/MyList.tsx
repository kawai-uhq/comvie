import { Grid, Status } from '../components/Rows';
import { signInComingSoon } from '../lib/auth';
import { useApp } from '../state';

export default function MyList() {
  const { favorites, session, openAuth } = useApp();
  return (
    <main className="page pad-top">
      <div className="container">
        <h1 className="title">My List</h1>
        {favorites.length === 0 ? (
          <Status kind="empty" text="Nothing here yet. Tap “+ My List” on any title to save it." />
        ) : (
          <Grid items={favorites} />
        )}
        {!session && (
          <p className="muted note">
            {signInComingSoon ? (
              'Saved on this device only. Accounts are coming soon, within about 2 weeks.'
            ) : (
              <>Saved on this device only. <button className="link" onClick={openAuth}>Sign in</button> to keep it if you clear your browser or switch devices.</>
            )}
          </p>
        )}
      </div>
    </main>
  );
}
