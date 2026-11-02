import { useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from '../store/api';
import { sessionUser } from '../store/helpers';
import { useAppState } from '../store/store';
import { Wordmark } from './Art';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium hover:underline ${isActive ? 'underline decoration-orange decoration-2 underline-offset-8' : ''}`;

export function useSession() {
  return sessionUser(useAppState());
}

/** Pages that need an account. Sends visitors to sign in, then back. */
export function RequireAuth() {
  const user = useSession();
  const location = useLocation();
  if (!user) return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  return <Outlet />;
}

export function Layout() {
  const user = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const onHome = pathname === '/'; // the home page's header sits on the sage hero

  // Close the mobile menu after navigating.
  useEffect(() => setOpen(false), [pathname]);

  const main = [
    { to: '/explore', label: 'Explore' },
    ...(user ? [{ to: '/my-maps', label: 'My Maps' }] : []),
  ];
  const right = user
    ? [
        ...(user.role === 'moderator' ? [{ to: '/review', label: 'Review' }] : []),
        { to: '/profile', label: user.username },
      ]
    : [{ to: '/signin', label: 'Sign in' }];

  const logout = () => {
    signOut();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className={`relative z-[1100] ${onHome ? 'bg-sage' : 'border-b-2 border-ink bg-page'}`}>
        <nav className="mx-auto flex h-16 max-w-7xl items-center gap-7 px-5 md:px-10" aria-label="Main">
          <NavLink to="/" aria-label="PinPoint home">
            <Wordmark />
          </NavLink>

          <div className="hidden items-center gap-7 md:flex">
            {main.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass}>{l.label}</NavLink>
            ))}
          </div>
          <div className="ml-auto hidden items-center gap-7 md:flex">
            {right.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass}>{l.label}</NavLink>
            ))}
            {user ? (
              <button type="button" className="rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-white" onClick={logout}>
                Sign out
              </button>
            ) : (
              <NavLink to="/signup" className="rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-white">Create account</NavLink>
            )}
          </div>

          <button
            type="button"
            className="ml-auto rounded-md bg-ink px-4 py-2 text-sm font-medium text-white md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </nav>

        {open && (
          <div id="mobile-menu" className="absolute inset-x-0 top-full border-b-2 border-ink bg-ink md:hidden">
            <ul className="flex flex-col px-5 py-2">
              {[...main, ...right].map((l) => (
                <li key={l.to} className="border-b border-white/15 last:border-0">
                  <NavLink to={l.to} className={({ isActive }) => `block py-3 font-display text-xl font-bold ${isActive ? 'text-orange' : 'text-white'}`}>
                    {l.label}
                  </NavLink>
                </li>
              ))}
              <li>
                {user ? (
                  <button type="button" className="block py-3 font-display text-xl font-bold text-white" onClick={logout}>
                    Sign out
                  </button>
                ) : (
                  <NavLink to="/signup" className="block py-3 font-display text-xl font-bold text-white">Create account</NavLink>
                )}
              </li>
            </ul>
          </div>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
