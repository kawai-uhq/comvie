import { useEffect, useRef, useState } from 'react';

interface Tip {
  text: string;
  x: number;
  y: number;
  below: boolean;
}

/** One shared tooltip: hover (or keyboard-focus) an icon button and its name appears. */
export default function Tooltip() {
  const [tip, setTip] = useState<Tip | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const target = useRef<Element | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia?.('(hover: hover)').matches) return;

    const hide = () => {
      window.clearTimeout(timer.current);
      target.current = null;
      setTip(null);
    };

    const find = (el: EventTarget | null): HTMLElement | null => {
      const n = (el as Element | null)?.closest?.('button[aria-label], a[aria-label], [data-tip]') as HTMLElement | null;
      if (!n || (n as HTMLButtonElement).disabled) return null;
      return n;
    };

    const show = (e: Event) => {
      const el = find(e.target);
      if (!el || el === target.current) return;
      const text = el.dataset.tip ?? el.getAttribute('aria-label') ?? '';
      // skip when the visible text already says it
      if (!text || (!el.dataset.tip && (el.textContent ?? '').toLowerCase().includes(text.toLowerCase()))) {
        hide();
        return;
      }
      window.clearTimeout(timer.current);
      target.current = el;
      timer.current = window.setTimeout(() => {
        if (target.current !== el || !el.isConnected) return;
        const r = el.getBoundingClientRect();
        const below = r.top < 70;
        setTip({ text, x: r.left + r.width / 2, y: below ? r.bottom + 8 : r.top - 8, below });
      }, 250);
    };

    const out = (e: Event) => {
      const el = find(e.target);
      if (el && el === target.current) hide();
    };

    document.addEventListener('mouseover', show);
    document.addEventListener('mouseout', out);
    document.addEventListener('focusin', show);
    document.addEventListener('focusout', hide);
    document.addEventListener('mousedown', hide);
    window.addEventListener('scroll', hide, true);
    return () => {
      document.removeEventListener('mouseover', show);
      document.removeEventListener('mouseout', out);
      document.removeEventListener('focusin', show);
      document.removeEventListener('focusout', hide);
      document.removeEventListener('mousedown', hide);
      window.removeEventListener('scroll', hide, true);
      window.clearTimeout(timer.current);
    };
  }, []);

  if (!tip) return null;
  const x = Math.min(Math.max(tip.x, 60), window.innerWidth - 60);
  return (
    <div className={`tooltip ${tip.below ? 'below' : ''}`} role="tooltip" style={{ left: x, top: tip.y }}>
      {tip.text}
    </div>
  );
}
