import { UserProfile } from '../../types';
import { currentUserMock } from '../../data/mockData';

let storedUser: UserProfile = { ...currentUserMock };

/**
 * Users Service layer
 * Prepared for clean replacement with FastAPI endpoints (/api/users/...)
 */
export const usersService = {
  async getProfile(): Promise<UserProfile> {
    return storedUser;
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    storedUser = {
      ...storedUser,
      ...updates,
    };
    return storedUser;
  },
};
