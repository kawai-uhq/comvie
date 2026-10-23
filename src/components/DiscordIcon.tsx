import { useState } from 'react';

/**
 * Shows the official Discord logo when it's been added as /public/discord.png;
 * until then, a plain chat-bubble stand-in so nothing looks broken.
 */
export default function DiscordIcon({ size = 56 }: { size?: number }) {
  const [missing, setMissing] = useState(false);
  return missing ? (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Discord" className="dc-fallback">
      <rect width="64" height="64" rx="18" fill="#5865f2" />
      <path d="M16 22a6 6 0 0 1 6-6h20a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H30l-8 7v-7a6 6 0 0 1-6-6z" fill="#fff" />
      <circle cx="26" cy="29" r="3" fill="#5865f2" />
      <circle cx="38" cy="29" r="3" fill="#5865f2" />
    </svg>
  ) : (
    <img src="/discord.png" width={size} height={size} alt="Discord" onError={() => setMissing(true)} />
  );
}
