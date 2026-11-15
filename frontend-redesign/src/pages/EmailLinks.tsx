import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { FieldCard } from '../components/FieldCard';
import { Input } from '../components/Input';
import { PasswordField } from '../components/PasswordField';
import { forgotPassword, resetPassword, verifyEmail } from '../store/api';
import { passwordProblems } from '../store/password';

function Shell({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-12 md:grid-cols-[1fr_1fr] md:px-10 md:py-20">
      <div>
        <h1 className="text-5xl md:text-6xl">{title}</h1>
        {intro && <p className="mt-3 max-w-md text-lg">{intro}</p>}
      </div>
      <FieldCard>{children}</FieldCard>
    </div>
  );
}

/** The link in the confirmation e-mail opens this page. */
export function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<'working' | 'done' | 'failed'>('working');
  const [message, setMessage] = useState('');

  // A link works only once, so the call must happen only once. React's development mode runs effects twice;
  // a ref keeps the second run from using the link again (and from showing a false "invalid link").
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!token) {
      setState('failed');
      setMessage('This link is incomplete. Please open it again from your e-mail.');
      return;
    }
    verifyEmail(token)
      .then(() => setState('done'))
      .catch((e) => {
        setState('failed');
        setMessage(e instanceof Error ? e.message : 'Could not confirm your e-mail.');
      });
  }, [token]);

  return (
    <Shell title={state === 'done' ? 'E-mail confirmed' : state === 'failed' ? 'Link problem' : 'Confirming…'}>
      {state === 'working' && <p role="status">One moment…</p>}
      {state === 'done' && (
        <>
          <p role="status">Thank you. Your e-mail address is confirmed and you can add maps and places.</p>
          <p className="mt-4"><Link to="/my-maps" className="font-bold underline">Go to My Maps</Link></p>
        </>
      )}
      {state === 'failed' && (
        <>
          <p role="alert" className="font-bold text-danger">{message}</p>
          <p className="mt-4 text-sm">Sign in and use "Send the link again" at the top of the page to get a new one.</p>
        </>
      )}
    </Shell>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <Shell title="Forgot password" intro="Enter your e-mail address and we will send you a link to choose a new password.">
      {sent ? (
        <p role="status">
          If an account uses that address, we have sent a link to reset the password. It works once and expires in one hour.
          Check your spam folder too.
        </p>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            try {
              await forgotPassword(email);
              setSent(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not send the link.');
            } finally {
              setBusy(false);
            }
          }}
        >
          <Input label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
          <div><Button type="submit" variant="primary" disabled={busy}>Send the link</Button></div>
        </form>
      )}
      <p className="mt-5 text-sm"><Link to="/signin" className="font-bold underline">Back to sign in</Link></p>
    </Shell>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const ok = passwordProblems(password, { username: '', email: '' }).length === 0;

  return (
    <Shell title="New password" intro="Choose a new password that follows the rules below.">
      {done ? (
        <>
          <p role="status">Your password is changed. You can sign in with it now.</p>
          <p className="mt-4"><Link to="/signin" className="font-bold underline">Sign in</Link></p>
        </>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            try {
              await resetPassword(token, password);
              setDone(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not change the password.');
            } finally {
              setBusy(false);
            }
          }}
        >
          {!token && <p role="alert" className="text-sm font-bold text-danger">This link is incomplete. Please open it again from your e-mail.</p>}
          <PasswordField label="New password" autoComplete="new-password" value={password} onChange={setPassword} showRules context={{ username: '', email: '' }} />
          {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
          <div><Button type="submit" variant="primary" disabled={busy || !ok || !token} className="disabled:opacity-40">Change password</Button></div>
        </form>
      )}
    </Shell>
  );
}
