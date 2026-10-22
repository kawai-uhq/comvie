const KEY = 'comvie.smooth';

/** Smooth mode: fade-ins, lighter card effects and preloading. On by default. */
export function isSmooth(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setSmooth(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* storage unavailable */
  }
  applySmooth(on);
}

export function applySmooth(on: boolean = isSmooth()): void {
  document.documentElement.classList.toggle('smooth', on);
}
