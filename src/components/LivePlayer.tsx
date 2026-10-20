import { useEffect, useRef, useState } from 'react';
import type { Channel } from '../lib/iptv';

interface Props {
  channel: Channel;
  onNext: () => void;
}

export default function LivePlayer({ channel, onNext }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    let destroyed = false;
    let cleanup = () => {};
    setError(false);

    (async () => {
      try {
        const { default: Hls } = await import('hls.js');
        if (destroyed) return;
        if (Hls.isSupported()) {
          const hls = new Hls({ lowLatencyMode: true });
          cleanup = () => hls.destroy();
          hls.on(Hls.Events.ERROR, (_e, data) => {
            if (data.fatal) setError(true);
          });
          hls.loadSource(channel.url);
          hls.attachMedia(el);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            void el.play().catch(() => undefined);
          });
        } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
          el.src = channel.url;
          void el.play().catch(() => undefined);
        } else {
          setError(true);
        }
      } catch {
        if (!destroyed) setError(true);
      }
    })();

    return () => {
      destroyed = true;
      cleanup();
      el.removeAttribute('src');
      el.load();
    };
  }, [channel.url, attempt]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(channel.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="live-player">
      <video ref={video} controls playsInline onError={() => setError(true)} />
      {error && (
        <div className="live-error" role="alert">
          <h3>Stream offline or blocked</h3>
          <p>This channel may be offline, restricted in your region, or not allowed to play on websites. Try the next channel.</p>
          <div className="actions center">
            <button className="btn small ghost" onClick={() => setAttempt((n) => n + 1)}>Retry</button>
            <button className="btn small primary" onClick={onNext}>Next channel ›</button>
            <button className="btn small ghost" onClick={() => void copy()}>{copied ? 'Copied' : 'Copy stream link'}</button>
            <a className="btn small ghost" href={channel.url} target="_blank" rel="noopener noreferrer">Direct link</a>
          </div>
        </div>
      )}
    </div>
  );
}
