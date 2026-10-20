import { useState } from 'react';

interface Props {
  name: string;
  logos: string[];
  className?: string;
}

/** Shows the first logo that loads; falls back to the channel's initials. */
export default function ChannelLogo({ name, logos, className }: Props) {
  const [i, setI] = useState(0);
  const src = logos[i];
  const initials = (name.match(/[\p{L}\p{N}]/gu) ?? ['?']).slice(0, 2).join('').toUpperCase();
  return (
    <span className={`channel-logo ${className ?? ''}`}>
      {src ? (
        <img
          key={src}
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setI((n) => n + 1)}
        />
      ) : (
        <b>{initials}</b>
      )}
    </span>
  );
}
