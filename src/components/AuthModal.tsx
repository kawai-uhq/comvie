import { useEffect, useState } from 'react';
import { AuthError, sendCode, signInComingSoon, verifyCode } from '../lib/auth';
import { useApp } from '../state';
import Logo from './Logo';

const RESEND_SECONDS = 60;

export default function AuthModal() {
  const { authOpen, closeAuth, onSignedIn } = useApp();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (!authOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && closeAuth();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [authOpen, busy, closeAuth]);

  if (!authOpen) return null;

  const send = async () => {
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await sendCode(clean);
      setEmail(clean);
      setCode('');
      setStep('code');
      setCooldown(RESEND_SECONDS);
      setInfo(`We emailed a code to ${clean}. Check spam if you don't see it.`);
    } catch (e) {
      setError(e instanceof AuthError ? e.message : "Couldn't send the code. Try again.");
    }
    setBusy(false);
  };

  const verify = async () => {
    if (code.length < 6) {
      setError('Enter the code from your email.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const s = await verifyCode(email, code);
      setStep('email');
      setCode('');
      setInfo(null);
      onSignedIn(s);
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'That code is wrong or has expired.');
    }
    setBusy(false);
  };

  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && !busy && closeAuth()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="modal-close" onClick={closeAuth} disabled={busy}>Not now</button>
        <Logo size={36} />
        {signInComingSoon ? (
          <>
            <h2 id="auth-title">Sign-in is coming soon</h2>
            <p className="muted">
              Accounts will be available within about 2 weeks. Until then, your My List and watch history are saved on this device.
            </p>
            <button className="btn primary wide" onClick={closeAuth}>Got it</button>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void (step === 'email' ? send() : verify());
            }}
          >
            <h2 id="auth-title">{step === 'email' ? 'Sign in or sign up' : 'Enter your code'}</h2>
            <p className="muted">
              {step === 'email'
                ? 'Optional. Sign in to save My List and watch history to your account and pick up on any device. We email a one-time code; new emails get an account automatically.'
                : `Type the code we sent to ${email}.`}
            </p>
            {step === 'email' ? (
              <input
                className="field"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="Email address"
                value={email}
                disabled={busy}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
              />
            ) : (
              <input
                className="field code"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                placeholder="••••••"
                value={code}
                disabled={busy}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 10));
                  setError(null);
                }}
              />
            )}
            {error ? <p className="error">{error}</p> : info ? <p className="muted small">{info}</p> : null}
            <button className="btn primary wide" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : step === 'email' ? 'Send code' : 'Verify and continue'}
            </button>
            {step === 'code' && (
              <div className="modal-links">
                <button type="button" className="link" disabled={busy || cooldown > 0} onClick={() => void send()}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
                <button
                  type="button"
                  className="link"
                  disabled={busy}
                  onClick={() => {
                    setStep('email');
                    setCode('');
                    setError(null);
                    setInfo(null);
                  }}
                >
                  Change email
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
