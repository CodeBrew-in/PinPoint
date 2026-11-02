export type Visibility = 'public' | 'private';
export type Role = 'member' | 'moderator';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  /** Salted PBKDF2-SHA256 (see passwordHash.ts). Demo only: the real backend uses Argon2id (see proposal). */
  passHash: string;
  bio: string;
  role: Role;
}

export interface Place {
  id: number;
  name: string;
  lat: number;
  lng: number;
  tags: string[];
  description: string;
  /** Resized JPEG data URLs. */
  photos: string[];
  addedBy: string; // username
  created: string; // ISO date
  verifiedOn?: string;
  verifiedBy?: string;
  /** Extra information added by people who matched this place as a duplicate. */
  notes: { by: string; text: string; date: string }[];
}

export interface MapData {
  id: string;
  title: string;
  description: string;
  category: string;
  visibility: Visibility;
  ownerId: string;
  /** Emails with access to a private map. */
  sharedWith: string[];
  created: string;
  updated: string;
  places: Place[];
}

export const REPORT_KINDS = [
  'Wrong location',
  'No longer exists',
  'Duplicate',
  'Spam or inappropriate',
  'Other',
] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

export interface Report {
  id: string;
  mapId: string;
  placeId: number;
  placeName: string;
  mapTitle: string;
  kind: ReportKind;
  by: string; // username
  note: string;
  date: string;
  status: 'open' | 'dismissed' | 'removed';
}

export interface State {
  users: User[];
  maps: MapData[];
  reports: Report[];
  sessionUserId: string | null;
}
