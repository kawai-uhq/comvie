import { useEffect, useState } from 'react';

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
}

/** "Install App" (when the browser offers it) and a back-to-top button. */
export default function Floating() {
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [top, setTop] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    const onInstalled = () => setInstall(null);
    const onScroll = () => setTop(window.scrollY > 700);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <>
      {install && (
        <button
          className="fab-install"
          onClick={() => {
            void install.prompt().finally(() => setInstall(null));
          }}
        >
          ⤓ Install App
        </button>
      )}
      {top && (
        <button className="fab-top" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          ↑
        </button>
      )}
    </>
  );
}
