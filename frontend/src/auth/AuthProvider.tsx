import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import axios from 'axios';
import api, { TOKEN_KEY } from '../lib/api';
import { AuthContext, type AuthStatus, type User } from './authContext';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    localStorage.getItem(TOKEN_KEY) ? 'loading' : 'anonymous',
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setStatus('anonymous');
  }, []);

  const loadUser = useCallback(async () => {
    const response = await api.get<User>('/auth/me');
    setUser(response.data);
    setStatus('authenticated');
  }, []);

  // On startup, check whether the saved token is still valid
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    loadUser().catch(logout);
  }, [loadUser, logout]);

  // Log out on any 401, e.g. when the token expires mid-session.
  // Login is skipped: a 401 there just means a wrong password.
  useEffect(() => {
    const id = api.interceptors.response.use(undefined, (error) => {
      const isLogin = error.config?.url === '/auth/login';
      if (axios.isAxiosError(error) && error.response?.status === 401 && !isLogin) {
        logout();
      }
      return Promise.reject(error);
    });
    return () => api.interceptors.response.eject(id);
  }, [logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem(TOKEN_KEY, response.data.access_token);
      try {
        await loadUser();
      } catch (err) {
        logout();
        throw err;
      }
    },
    [loadUser, logout],
  );

  const value = useMemo(() => ({ user, status, login, logout }), [user, status, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
