import { IMG } from '../lib/tmdb';
import type { Media } from '../lib/types';

/**
 * Soft blurred copy of the featured titles' artwork behind the home page, so the page colours follow
 * the billboard as it changes. Fades out down the page.
 */
export default function Ambient({ items, active }: { items: Media[]; active: number }) {
  return (
    <div className="ambient" aria-hidden="true">
      {items.map((m, n) =>
        m.backdrop ? <img key={m.type + m.id} className={n === active ? 'on' : ''} src={IMG.still + m.backdrop} alt="" /> : null
      )}
    </div>
  );
}
