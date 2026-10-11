import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export default function Layout() {
  const { user, status, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-xl font-bold text-blue-600">
            PinPoint
          </Link>

          {status === 'authenticated' && user && (
            <div className="flex items-center gap-4 text-sm">
              <Link to="/account" className="truncate text-gray-700 hover:text-blue-600">
                {user.email}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-100"
              >
                Log out
              </button>
            </div>
          )}

          {status === 'anonymous' && (
            <div className="flex items-center gap-4 text-sm font-medium">
              <Link to="/login" className="text-gray-700 hover:text-blue-600">
                Log in
              </Link>
              <Link to="/signup" className="rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
