import { UserProfile } from '../../types';
import { currentUserMock } from '../../data/mockData';

/**
 * Auth Service layer
 * Prepared for clean replacement with FastAPI endpoints (/api/auth/...)
 */
export const authService = {
  async getCurrentUser(): Promise<UserProfile | null> {
    return currentUserMock;
  },

  async login(email?: string, password?: string): Promise<UserProfile> {
    return currentUserMock;
  },

  async signup(name: string, email: string, handle: string): Promise<UserProfile> {
    return {
      ...currentUserMock,
      name,
      email,
      handle: handle.startsWith('@') ? handle : `@${handle}`,
    };
  },

  async logout(): Promise<void> {
    return;
  },
};
