import { useCallback, useEffect, useRef, useState } from 'react';
import { countryName, flag } from '../lib/iptv';
import type { Channel } from '../lib/iptv';
import ChannelLogo from './ChannelLogo';
import Icon from './Icon';

interface Props {
  channel: Channel;
  onNext: () => void;
  onPrev: () => void;
  fav: boolean;
  onToggleFav: () => void;
  onShowList: () => void;
  onFail?: () => void;
  onOk?: () => void;
}

const fmt = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

function Ico({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const I = {
  play: 'M8 5v14l11-7z',
  pause: 'M6 5h4v14H6zm8 0h4v14h-4z',
  prev: 'M15.4 6 9.4 12l6 6 1.4-1.4L12.2 12l4.6-4.6z',
  next: 'M8.6 6 7.2 7.4 11.8 12l-4.6 4.6L8.6 18l6-6z',
  vol: 'M4 9v6h4l5 4V5L8 9zm11.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z',
  mute: 'M4 9v6h4l5 4V5L8 9zm12.6 3 2.4-2.4-1.4-1.4-2.4 2.4-2.4-2.4-1.4 1.4 2.4 2.4-2.4 2.4 1.4 1.4 2.4-2.4 2.4 2.4 1.4-1.4z',
  link: 'M10.6 13.4a1 1 0 0 1 0-1.4l3-3a3 3 0 1 1 4.2 4.2l-1.5 1.5-1.4-1.4 1.5-1.5a1 1 0 0 0-1.4-1.4l-3 3a1 1 0 0 1-1.4 0zm2.8-2.8a1 1 0 0 1 0 1.4l-3 3a3 3 0 1 1-4.2-4.2l1.5-1.5 1.4 1.4-1.5 1.5a1 1 0 1 0 1.4 1.4l3-3a1 1 0 0 1 1.4 0z',
  pip: 'M19 7H5v10h14zm2-2v14H3V5zm-5 6h-4v3h4z',
  full: 'M5 5h5v2H7v3H5zm9 0h5v5h-2V7h-3zM5 14h2v3h3v2H5zm12 0h2v5h-5v-2h3z',
  list: 'M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z',
  star: 'M12 3.5l2.6 5.5 6 .8-4.4 4.1 1.1 6L12 17l-5.3 2.9 1.1-6L3.4 9.8l6-.8z'
};

export default function LivePlayer({ channel, onNext, onPrev, fav, onToggleFav, onShowList, onFail, onOk }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [copied, setCopied] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [behind, setBehind] = useState(0); // seconds behind the live edge
  const [progress, setProgress] = useState(1); // 0..1 inside the seekable window
  const [fullscreen, setFullscreen] = useState(false);
  const cb = useRef({ onFail, onOk });
  cb.current = { onFail, onOk };
  const fail = useCallback(() => {
    setError(true);
    cb.current.onFail?.();
  }, []);

  // Load the stream
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    let destroyed = false;
    let cleanup = () => {};
    setError(false);
    setBuffering(true);

    (async () => {
      try {
        const { default: Hls } = await import('hls.js');
        if (destroyed) return;
        if (Hls.isSupported()) {
          const hls = new Hls({ lowLatencyMode: true });
          cleanup = () => hls.destroy();
          hls.on(Hls.Events.ERROR, (_e, data) => {
            if (data.fatal) fail();
          });
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            void el.play().catch(() => undefined);
          });
          hls.loadSource(channel.url);
          hls.attachMedia(el);
        } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
          el.src = channel.url;
          void el.play().catch(() => undefined);
        } else {
          fail();
        }
      } catch {
        if (!destroyed) fail();
      }
    })();

    return () => {
      destroyed = true;
      cleanup();
      el.removeAttribute('src');
      el.load();
    };
  }, [channel.url, attempt, fail]);

  // Mirror the video's state into the custom controls
  useEffect(() => {
    const el = video.current;
    if (!el) return;
    const sync = () => {
      setPlaying(!el.paused);
      setMuted(el.muted);
      setVolume(el.volume);
    };
    const time = () => {
      const r = el.seekable;
      if (r.length) {
        const start = r.start(0);
        const end = r.end(r.length - 1);
        setBehind(Math.max(0, end - el.currentTime));
        setProgress(end > start ? Math.min(1, Math.max(0, (el.currentTime - start) / (end - start))) : 1);
      }
    };
    const on = (n: string, f: () => void) => el.addEventListener(n, f);
    const off = (n: string, f: () => void) => el.removeEventListener(n, f);
    const wait = () => setBuffering(true);
    const ready = () => setBuffering(false);
    const ok = () => cb.current.onOk?.();
    const evs: [string, () => void][] = [
      ['play', sync], ['pause', sync], ['volumechange', sync], ['timeupdate', time],
      ['waiting', wait], ['playing', ready], ['playing', ok], ['canplay', ready]
    ];
    evs.forEach(([n, f]) => on(n, f));
    sync();
    return () => evs.forEach(([n, f]) => off(n, f));
  }, []);

  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === box.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const togglePlay = useCallback(() => {
    const el = video.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => undefined);
    else el.pause();
  }, []);

  const toggleFullscreen = useCallback(() => {
    const b = box.current;
    const el = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (!b || !el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (b.requestFullscreen) void b.requestFullscreen().catch(() => undefined);
    else el.webkitEnterFullscreen?.(); // iPhone Safari
  }, []);

  // Keyboard: F = fullscreen, Space = play / pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(t.tagName)) return;
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleFullscreen, togglePlay]);

  const goLive = () => {
    const el = video.current;
    if (el && el.seekable.length) el.currentTime = el.seekable.end(el.seekable.length - 1);
  };

  const seek = (v: number) => {
    const el = video.current;
    if (!el || !el.seekable.length) return;
    const start = el.seekable.start(0);
    const end = el.seekable.end(el.seekable.length - 1);
    el.currentTime = start + (end - start) * v;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(channel.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  const pip = async () => {
    const el = video.current;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await el?.requestPictureInPicture();
    } catch {
      /* not supported */
    }
  };

  const canPip = typeof document !== 'undefined' && document.pictureInPictureEnabled;
  const atLive = behind < 4;

  return (
    <div className={`live-player ${fullscreen ? 'fs' : ''}`} ref={box}>
      <div className="lp-head">
        <ChannelLogo name={channel.name} logos={channel.logos} className="lp-logo" />
        <div className="lp-info">
          <div className="lp-title">
            <strong>{channel.name}</strong>
            <span className={`badge ${atLive ? 'live' : ''}`}>{atLive ? <><i className="live-dot" />LIVE</> : `-${fmt(behind)}`}</span>
            {channel.quality && <span className="badge">{channel.quality.toUpperCase()}</span>}
          </div>
          <small>{flag(channel.country)} {countryName(channel.country)} · {channel.categories[0] ?? 'general'}</small>
        </div>
        <button className={`lp-icon ${fav ? 'on' : ''}`} onClick={onToggleFav} aria-pressed={fav} aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}>
          <Ico d={I.star} />
        </button>
        <button className="lp-icon" onClick={onShowList} aria-label="Show channel list"><Ico d={I.list} /></button>
      </div>

      <div className="lp-stage">
        <video ref={video} playsInline onClick={togglePlay} onError={fail} />
        {buffering && !error && <div className="lp-spin"><div className="spinner" aria-label="Loading" /></div>}
        {error && (
          <div className="live-error" role="alert">
            <h3>Stream offline or blocked</h3>
            <p>This channel may be offline, restricted in your region, or not allowed to play on websites. Try the next channel.</p>
            <div className="actions center">
              <button className="btn small ghost" onClick={() => setAttempt((n) => n + 1)}>Retry</button>
              <button className="btn small primary" onClick={onNext}>Next channel<Icon name="chevronRight" size={14} /></button>
              <button className="btn small ghost" onClick={() => void copy()}>{copied ? 'Copied' : 'Copy stream link'}</button>
              <a className="btn small ghost" href={channel.url} target="_blank" rel="noopener noreferrer">Direct link</a>
            </div>
          </div>
        )}
      </div>

      <div className="lp-bar">
        <input
          className="lp-progress"
          type="range"
          min={0}
          max={1000}
          value={Math.round(progress * 1000)}
          onChange={(e) => seek(Number(e.target.value) / 1000)}
          aria-label="Position"
          style={{ '--p': `${progress * 100}%` } as React.CSSProperties}
        />
        <div className="lp-controls">
          <button className="lp-icon" onClick={onPrev} aria-label="Previous channel"><Ico d={I.prev} /></button>
          <button className="lp-play" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}><Ico d={playing ? I.pause : I.play} /></button>
          <button className="lp-icon" onClick={onNext} aria-label="Next channel"><Ico d={I.next} /></button>
          <button className="badge btn-badge" onClick={goLive} aria-label="Jump to live">{atLive ? <><i className="live-dot" />LIVE</> : `-${fmt(behind)}`}</button>
          <button className="lp-icon" onClick={() => { const el = video.current; if (el) el.muted = !el.muted; }} aria-label={muted ? 'Unmute' : 'Mute'}>
            <Ico d={muted || volume === 0 ? I.mute : I.vol} />
          </button>
          <input
            className="lp-volume"
            type="range"
            min={0}
            max={100}
            value={muted ? 0 : Math.round(volume * 100)}
            onChange={(e) => {
              const el = video.current;
              if (!el) return;
              const v = Number(e.target.value) / 100;
              el.volume = v;
              el.muted = v === 0;
            }}
            aria-label="Volume"
            style={{ '--p': `${muted ? 0 : volume * 100}%` } as React.CSSProperties}
          />
          <span className="lp-spacer" />
          <button className="lp-chip" onClick={() => void copy()}><Ico d={I.link} /><span>{copied ? 'Copied' : 'Link'}</span></button>
          {canPip && <button className="lp-icon" onClick={() => void pip()} aria-label="Picture in picture"><Ico d={I.pip} /></button>}
          <button className="lp-icon" onClick={toggleFullscreen} aria-label="Fullscreen"><Ico d={I.full} /></button>
        </div>
      </div>
      <p className="lp-hint">Press <kbd>F</kbd> for fullscreen, <kbd>Space</kbd> to pause</p>
    </div>
  );
}
