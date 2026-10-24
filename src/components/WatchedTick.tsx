import Icon from './Icon';

/** Round tick on an episode row: mark an episode as watched / unwatched without opening it. */
export default function WatchedTick({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <span
      role="button"
      tabIndex={0}
      className={`ep-check ${on ? 'on' : ''}`}
      aria-pressed={on}
      aria-label={on ? 'Mark as unwatched' : 'Mark as watched'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }
      }}
    >
      <Icon name="check" size={15} />
    </span>
  );
}
