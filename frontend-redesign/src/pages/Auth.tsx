import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { FieldCard } from '../components/FieldCard';
import { Input } from '../components/Input';
import { useSession } from '../components/Layout';
import { PasswordField } from '../components/PasswordField';
import { signIn, signUp } from '../store/api';
import { passwordProblems } from '../store/password';

function AuthShell({ title, intro, children, footer }: { title: string; intro: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-12 md:grid-cols-[1fr_1fr] md:px-10 md:py-20">
      <div>
        <h1 className="text-5xl md:text-6xl">{title}</h1>
        <p className="mt-3 max-w-md text-lg">{intro}</p>
      </div>
      <FieldCard>
        {children}
        <p className="mt-5 text-sm">{footer}</p>
      </FieldCard>
    </div>
  );
}

function useAfterAuth() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  return from && from !== '/signin' && from !== '/signup' ? from : '/my-maps';
}

export function SignIn() {
  const navigate = useNavigate();
  const user = useSession();
  const after = useAfterAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={after} replace />;

  return (
    <AuthShell
      title="Sign in"
      intro="Sign in to open your maps."
      footer={<>New here? <Link to="/signup" state={{ from: after }} className="font-bold underline">Create an account</Link></>}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          try {
            await signIn(email, password);
            navigate(after, { replace: true });
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not sign in.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <Input label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
        <div className="flex items-center justify-between gap-3">
          <Button type="submit" variant="primary" disabled={busy}>Sign in</Button>
          <button type="button" className="label underline underline-offset-4" onClick={() => setError('Password reset needs the backend and is not built yet.')}>
            Forgot password?
          </button>
        </div>
      </form>
    </AuthShell>
  );
}

export function SignUp() {
  const navigate = useNavigate();
  const user = useSession();
  const after = useAfterAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const passwordOk = passwordProblems(password, { username, email }).length === 0;

  if (user) return <Navigate to={after} replace />;

  return (
    <AuthShell
      title="Create account"
      intro="A username, an email and a password that follows the rules below."
      footer={<>Already have an account? <Link to="/signin" state={{ from: after }} className="font-bold underline">Sign in</Link></>}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          try {
            await signUp({ username, email, password });
            navigate(after, { replace: true });
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not create the account.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <Input label="Username" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} />
        <Input label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          showRules
          context={{ username, email }}
        />
        {error && <p role="alert" className="text-sm font-bold text-danger">{error}</p>}
        <div>
          <Button type="submit" variant="primary" disabled={busy || !passwordOk} className="disabled:opacity-40">Create account</Button>
        </div>
      </form>
    </AuthShell>
  );
}
