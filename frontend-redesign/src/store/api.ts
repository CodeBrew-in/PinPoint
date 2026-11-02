import { canView, sessionUser } from './helpers';
import { passwordError } from './password';
import { hashPassword, verifyAgainstDecoy, verifyPassword } from './passwordHash';
import { commit, getState } from './store';
import type { MapData, Place, ReportKind, State, User, Visibility } from './types';

/**
 * All reads and writes go through here. Today this works on browser storage;
 * each function maps to one endpoint of the planned FastAPI backend.
 */

const today = () => new Date().toISOString().slice(0, 10);
// Random ids from the browser's secure generator (these show up in URLs and as user ids).
const rand = () => [...crypto.getRandomValues(new Uint8Array(4))].map((b) => b.toString(36).padStart(2, '0')).join('').slice(0, 6);

function requireUser(s: State): User {
  const u = sessionUser(s);
  if (!u) throw new Error('Please sign in first.');
  return u;
}

/** Returns the map if the signed-in user may change it (any signed-in user for public maps). */
function writableMap(s: State, mapId: string): MapData {
  const user = requireUser(s);
  const map = s.maps.find((m) => m.id === mapId);
  if (!map || !canView(map, user)) throw new Error('Map not found.');
  return map;
}

function withMap(s: State, mapId: string, fn: (m: MapData) => MapData): State {
  return { ...s, maps: s.maps.map((m) => (m.id === mapId ? fn(m) : m)) };
}

function withPlace(s: State, mapId: string, placeId: number, fn: (p: Place) => Place): State {
  return withMap(s, mapId, (m) => ({ ...m, updated: today(), places: m.places.map((p) => (p.id === placeId ? fn(p) : p)) }));
}

/* ---------- auth ---------- */

export async function signUp(input: { username: string; email: string; password: string }) {
  const s = getState();
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  if (username.length < 3) throw new Error('Username needs at least 3 characters.');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email address.');
  const pwError = passwordError(input.password, { username, email });
  if (pwError) throw new Error(pwError);
  if (s.users.some((u) => u.email === email)) throw new Error('An account with this email already exists.');
  if (s.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) throw new Error('That username is taken.');
  const user: User = { id: `u-${rand()}`, username, name: username, email, passHash: await hashPassword(input.password), bio: '', role: 'member' };
  commit({ ...getState(), users: [...getState().users, user], sessionUserId: user.id });
}

export async function signIn(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase();
  const user = getState().users.find((u) => u.email === email);
  // Same message for unknown email and wrong password.
  if (!user) {
    await verifyAgainstDecoy(password); // keep the timing the same as a wrong password
    throw new Error('Email or password is not correct.');
  }
  if (!(await verifyPassword(password, user.passHash))) throw new Error('Email or password is not correct.');
  commit({ ...getState(), sessionUserId: user.id });
}

export function signOut() {
  commit({ ...getState(), sessionUserId: null });
}

export function updateProfile(input: { name: string; email: string; bio: string }) {
  const s = getState();
  const me = requireUser(s);
  const email = input.email.trim().toLowerCase();
  if (input.name.trim() === '') throw new Error('Name cannot be empty.');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email address.');
  if (s.users.some((u) => u.id !== me.id && u.email === email)) throw new Error('Another account already uses this email.');
  commit({
    ...s,
    users: s.users.map((u) => (u.id === me.id ? { ...u, name: input.name.trim(), email, bio: input.bio } : u)),
    // Keep access to maps shared with the old address.
    maps: s.maps.map((m) => ({ ...m, sharedWith: m.sharedWith.map((e) => (e === me.email ? email : e)) })),
  });
}

export async function changePassword(current: string, next: string) {
  const s = getState();
  const me = requireUser(s);
  if (!(await verifyPassword(current, me.passHash))) throw new Error('Current password is not correct.');
  const pwError = passwordError(next, { username: me.username, email: me.email });
  if (pwError) throw new Error(pwError);
  const passHash = await hashPassword(next);
  commit({ ...getState(), users: getState().users.map((u) => (u.id === me.id ? { ...u, passHash } : u)) });
}

/* ---------- maps ---------- */

export function createMap(input: { title: string; description: string; category: string; visibility: Visibility }): string {
  const s = getState();
  const me = requireUser(s);
  const title = input.title.trim();
  if (title.length < 3) throw new Error('Give your map a name (at least 3 characters).');
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
  const map: MapData = {
    id: `${slug || 'map'}-${rand()}`,
    title,
    description: input.description.trim(),
    category: input.category,
    visibility: input.visibility,
    ownerId: me.id,
    sharedWith: [],
    created: today(),
    updated: today(),
    places: [],
  };
  commit({ ...s, maps: [...s.maps, map] });
  return map.id;
}

export function shareMap(mapId: string, emailRaw: string) {
  const s = getState();
  const me = requireUser(s);
  const map = s.maps.find((m) => m.id === mapId);
  if (!map || map.ownerId !== me.id) throw new Error('Only the owner can share this map.');
  if (map.visibility !== 'private') throw new Error('Public maps do not need sharing.');
  const email = emailRaw.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email address.');
  if (email === me.email) throw new Error('You already own this map.');
  if (map.sharedWith.includes(email)) throw new Error('Already has access.');
  commit(withMap(s, mapId, (m) => ({ ...m, sharedWith: [...m.sharedWith, email] })));
}

export function unshareMap(mapId: string, email: string) {
  const s = getState();
  const me = requireUser(s);
  const map = s.maps.find((m) => m.id === mapId);
  if (!map || map.ownerId !== me.id) throw new Error('Only the owner can change access.');
  commit(withMap(s, mapId, (m) => ({ ...m, sharedWith: m.sharedWith.filter((e) => e !== email) })));
}

/* ---------- places ---------- */

export function addPlace(
  mapId: string,
  input: { name: string; description: string; lat: number; lng: number; tags: string[]; photo?: string },
): number {
  const s = getState();
  const me = requireUser(s);
  const map = writableMap(s, mapId);
  if (input.name.trim() === '') throw new Error('Give the place a name.');
  if (!(Math.abs(input.lat) <= 90 && Math.abs(input.lng) <= 180)) throw new Error('Coordinates are not valid.');
  if (input.tags.length === 0) throw new Error('Pick at least one tag.');
  const id = Math.max(0, ...map.places.map((p) => p.id)) + 1;
  const place: Place = {
    id,
    name: input.name.trim(),
    lat: input.lat,
    lng: input.lng,
    tags: input.tags,
    description: input.description.trim(),
    photos: input.photo ? [input.photo] : [],
    addedBy: me.username,
    created: today(),
    notes: [],
  };
  commit(withMap(s, mapId, (m) => ({ ...m, updated: today(), places: [...m.places, place] })));
  return id;
}

/** Used when a new submission is recognised as an existing place. */
export function addToExistingPlace(mapId: string, placeId: number, input: { photo?: string; note?: string }) {
  const s = getState();
  const me = requireUser(s);
  writableMap(s, mapId);
  commit(
    withPlace(s, mapId, placeId, (p) => ({
      ...p,
      photos: input.photo ? [...p.photos, input.photo] : p.photos,
      notes: input.note?.trim() ? [...p.notes, { by: me.username, text: input.note.trim(), date: today() }] : p.notes,
    })),
  );
}

export function addPhoto(mapId: string, placeId: number, photo: string) {
  const s = getState();
  writableMap(s, mapId);
  commit(withPlace(s, mapId, placeId, (p) => ({ ...p, photos: [...p.photos, photo] })));
}

export function verifyPlace(mapId: string, placeId: number) {
  const s = getState();
  const me = requireUser(s);
  writableMap(s, mapId);
  commit(withPlace(s, mapId, placeId, (p) => ({ ...p, verifiedOn: today(), verifiedBy: me.username })));
}

export function reportPlace(mapId: string, placeId: number, kind: ReportKind, note: string) {
  const s = getState();
  const me = requireUser(s);
  const map = writableMap(s, mapId);
  const place = map.places.find((p) => p.id === placeId);
  if (!place) throw new Error('Place not found.');
  commit({
    ...s,
    reports: [
      { id: `r-${rand()}`, mapId, placeId, placeName: place.name, mapTitle: map.title, kind, by: me.username, note: note.trim(), date: today(), status: 'open' },
      ...s.reports,
    ],
  });
}

/* ---------- moderation ---------- */

export function resolveReport(reportId: string, action: 'dismissed' | 'removed') {
  const s = getState();
  const me = requireUser(s);
  if (me.role !== 'moderator') throw new Error('Only moderators can do this.');
  const report = s.reports.find((r) => r.id === reportId);
  if (!report) throw new Error('Report not found.');
  let next: State = { ...s, reports: s.reports.map((r) => (r.id === reportId ? { ...r, status: action } : r)) };
  if (action === 'removed') {
    next = withMap(next, report.mapId, (m) => ({ ...m, updated: today(), places: m.places.filter((p) => p.id !== report.placeId) }));
    // Other open reports about the same place are settled too.
    next = {
      ...next,
      reports: next.reports.map((r) => (r.status === 'open' && r.mapId === report.mapId && r.placeId === report.placeId ? { ...r, status: 'removed' } : r)),
    };
  }
  commit(next);
}

/* ---------- photos ---------- */

/** Shrinks a photo so several fit in browser storage. */
export async function fileToDataUrl(file: File, maxSide = 900): Promise<string> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('This image could not be read. Try a JPG or PNG.');
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.75);
}
