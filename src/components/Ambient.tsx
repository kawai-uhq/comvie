import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IMG } from '../lib/tmdb';
import type { Media } from '../lib/types';

/**
 * Frosted-glass backdrop for the whole home page: a soft blurred copy of the featured title's artwork
 * that stays behind everything from top to bottom and crossfades as the billboard changes.
 * (Rendered on <body> so scrolling and page animations never move it.)
 */
export default function Ambient({ items, active }: { items: Media[]; active: number }) {
  useEffect(() => {
    document.documentElement.classList.add('has-ambient');
    return () => document.documentElement.classList.remove('has-ambient');
  }, []);

  return createPortal(
    <div className="ambient" aria-hidden="true">
      {items.map((m, n) =>
        m.backdrop ? <img key={m.type + m.id} className={n === active ? 'on' : ''} src={IMG.still + m.backdrop} alt="" /> : null
      )}
      <div className="ambient-glass" />
    </div>,
    document.body
  );
}
