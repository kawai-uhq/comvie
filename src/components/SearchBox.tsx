import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { thumbSrc, tmdb } from '../lib/tmdb';
import { mediaKey } from '../lib/types';
import type { Media } from '../lib/types';

const MIN_CHARS = 2; // start suggesting after this many letters
const MAX_ROWS = 7;
const DELAY_MS = 200; // wait for a pause in typing

/** Lower-case and drop accents so "amelie" matches "Amélie". */
const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Titles that start with what you typed come first, then word starts, then anything else. */
function rank(items: Media[], term: string): Media[] {
  const t = fold(term);
  const score = (m: Media) => {
    const title = fold(m.title);
    if (title === t) return 0;
    if (title.startsWith(t)) return 1;
    if (title.split(/[\s:\-–—.,'!?&()]+/).some((w) => w.startsWith(t))) return 2;
    if (title.includes(t)) return 3;
    return 4; // matched through another name or translation: keep TMDB's order
  };
  return items
    .map((m, i) => ({ m, i, s: score(m) }))
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .map((x) => x.m);
}

/** Bold the part of the title that matches what was typed. */
function Highlight({ text, term }: { text: string; term: string }) {
  const f = fold(text);
  const t = fold(term);
  const at = t ? f.indexOf(t) : -1;
  if (at < 0 || f.length !== text.length) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, at + t.length)}</mark>
      {text.slice(at + t.length)}
    </>
  );
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  /** Enter with nothing highlighted, or "See all results". */
  onSubmit: (term: string) => void;
  /** Called after a suggestion is opened (e.g. to clear the box). */
  onPick?: () => void;
  className?: string;
  inputClassName?: string;
  type?: 'text' | 'search';
  autoFocus?: boolean;
  /** Dropdown as wide as the box (for a full-width input) instead of a wider panel under it. */
  wide?: boolean;
}

export default function SearchBox({
  value,
  onChange,
  onSubmit,
  onPick,
  className = '',
  inputClassName,
  type = 'text',
  autoFocus,
  wide
}: Props) {
  const nav = useNavigate();
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const ticket = useRef(0); // only the newest request may update the list

  const [items, setItems] = useState<Media[]>([]);
  const [loaded, setLoaded] = useState(''); // the term the list on screen was fetched for
  const [failed, setFailed] = useState(false);
  const [focus, setFocus] = useState(false);
  // Closed until the person types, so arriving on a page with a filled box doesn't pop it open
  const [dismissed, setDismissed] = useState(true);
  const [active, setActive] = useState(-1);

  const term = value.trim();
  const show = focus && !dismissed && term.length >= MIN_CHARS;
  const rows = items.length ? items.length + 1 : 0; // titles + the "See all" row

  useEffect(() => {
    if (term.length < MIN_CHARS) {
      ticket.current++;
      setItems([]);
      setLoaded('');
      setFailed(false);
      return;
    }
    const id = ++ticket.current;
    const t = window.setTimeout(() => {
      tmdb
        .search(term)
        .then((r) => {
          if (id !== ticket.current) return;
          setItems(rank(r, term).slice(0, MAX_ROWS));
          setFailed(false);
          setLoaded(term);
          setActive(-1);
        })
        .catch(() => {
          if (id !== ticket.current) return;
          setItems([]);
          setFailed(true);
          setLoaded(term);
        });
    }, DELAY_MS);
    return () => window.clearTimeout(t);
  }, [term]);

  const close = () => {
    setDismissed(true);
    setActive(-1);
  };

  const picked = () => {
    close();
    input.current?.blur();
    onPick?.();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!term) return;
    close();
    input.current?.blur();
    onSubmit(term);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (term.length < MIN_CHARS) return;
      if (dismissed) {
        setDismissed(false);
        return;
      }
      if (!rows) return;
      e.preventDefault();
      setActive((a) => (e.key === 'ArrowDown' ? (a + 1) % rows : a <= 0 ? rows - 1 : a - 1));
    } else if (e.key === 'Enter') {
      if (show && active >= 0 && active < items.length) {
        e.preventDefault();
        const m = items[active];
        nav(`/title/${m.type}/${m.id}`);
        picked();
      }
    } else if (e.key === 'Escape' && show) {
      e.preventDefault();
      close();
    }
  };

  const meta = (m: Media) =>
    [m.type === 'tv' ? 'Series' : 'Movie', m.year, m.rating > 0 ? `★ ${m.rating.toFixed(1)}` : '']
      .filter(Boolean)
      .join(' · ');

  return (
    <form
      className={`sbox ${wide ? 'wide' : ''} ${className}`}
      role="search"
      onSubmit={submit}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false);
      }}
    >
      <input
        ref={input}
        className={inputClassName}
        type={type}
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        autoFocus={autoFocus}
        value={value}
        placeholder="Search movies, shows, anime…"
        aria-label="Search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={show && items.length > 0}
        aria-controls={show ? listId : undefined}
        aria-activedescendant={show && active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => {
          onChange(e.target.value);
          setDismissed(false);
          setActive(-1);
        }}
        onFocus={() => setFocus(true)}
        onClick={() => term.length >= MIN_CHARS && setDismissed(false)}
        onKeyDown={onKeyDown}
      />

      {show && (
        // keep focus in the input while pressing inside the panel, so a click isn't lost on blur
        <div className="suggest" onMouseDown={(e) => e.preventDefault()}>
          {items.length > 0 ? (
            <ul id={listId} role="listbox" aria-label="Suggestions">
              {items.map((m, i) => (
                <li
                  key={mediaKey(m)}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={active === i}
                  className={active === i ? 'on' : ''}
                  onMouseEnter={() => setActive(i)}
                >
                  <Link to={`/title/${m.type}/${m.id}`} className="suggest-item" tabIndex={-1} onClick={picked}>
                    <span className="suggest-thumb">
                      {m.poster ? <img src={thumbSrc(m.poster)} alt="" width={40} height={60} loading="lazy" /> : <b>{m.title.slice(0, 1)}</b>}
                    </span>
                    <span className="suggest-text">
                      <strong><Highlight text={m.title} term={term} /></strong>
                      <small>{meta(m)}</small>
                    </span>
                  </Link>
                </li>
              ))}
              <li
                id={`${listId}-${items.length}`}
                role="option"
                aria-selected={active === items.length}
                className={active === items.length ? 'on' : ''}
                onMouseEnter={() => setActive(items.length)}
              >
                <button type="submit" className="suggest-item suggest-all" tabIndex={-1}>
                  <span>See all results for “{term}”</span>
                  <span aria-hidden="true">→</span>
                </button>
              </li>
            </ul>
          ) : (
            <p className="suggest-note" id={listId} role="status">
              {loaded !== term
                ? 'Searching…'
                : failed
                  ? "Couldn't load suggestions. Press Enter to search."
                  : `No titles match “${term}”.`}
            </p>
          )}
        </div>
      )}
    </form>
  );
}
