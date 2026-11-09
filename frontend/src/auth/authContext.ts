import { createContext } from 'react';

// Matches the User schema in docs/api-contract.md
export type User = {
  id: number;
  email: string;
  created_at?: string;
};

// 'loading' while we check a saved token with /auth/me on startup
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
