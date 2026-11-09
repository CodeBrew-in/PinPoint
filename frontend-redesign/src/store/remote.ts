/**
 * The same operations as api.ts, but against the real backend (docs/api-contract.md).
 *
 * The store (store.ts) stays the single place the pages read from. Here it works as a cache:
 * loaders fetch from the server and put the result in the store, and every change goes to the server first
 * and then refreshes the part of the cache it touched.
 */
import { ApiError, clearToken, getToken, mediaUrl, request, setToken } from '../lib/http';
import { commit, getState, setAuthReady } from './store';
import type { MapData, Place, Report, ReportKind, State, User, Visibility } from './types';

/* ---------- what the server sends (see the contract) ---------- */

interface ApiUser { id: number; email: string; username: string; name: string; bio: string; role: string }
interface ApiPin { lat: number; lng: number; name: string }
interface ApiMap {
  id: number; title: string; description: string; category: string; visibility: string;
  owner_id: number; owner_username: string; owner_name: string;
  place_count: number; contributor_count: number; pins: ApiPin[]; shared_with: string[];
  created_at: string; updated_at: string;
}
interface ApiLocation {
  id: number; name: string; description: string; lat: number; lng: number; tags: string[];
  photos: { id: number; url: string }[];
  notes: { id: number; username: string; text: string; created_at: string }[];
  owner_username: string; verified_at: string | null; verified_by: string | null; created_at: string;
}
interface ApiReport {
  id: number; location_id: number | null; place_name: string; map_title: string | null; kind: string;
  note: string; reporter_username: string; status: string; created_at: string;
}

/* ---------- converting to the shapes the pages already use ---------- */

const userId = (id: number) => `u-${id}`;
const day = (iso: string) => iso.slice(0, 10);

const REPORT_KIND_TO_API: Record<ReportKind, string> = {
  'Wrong location': 'wrong_location',
  'No longer exists': 'no_longer_exists',
  Duplicate: 'duplicate',
  'Spam or inappropriate': 'spam',
  Other: 'other',
};
const REPORT_KIND_FROM_API = Object.fromEntries(Object.entries(REPORT_KIND_TO_API).map(([label, api]) => [api, label])) as Record<
  string,
  ReportKind
>;

function userFromApi(u: ApiUser): User {
  return {
    id: userId(u.id), username: u.username, name: u.name, email: u.email, bio: u.bio,
    role: u.role === 'moderator' ? 'moderator' : 'member',
    passHash: '', // the server keeps passwords; the browser never has one
  };
}

function placeFromApi(l: ApiLocation): Place {
  return {
    id: l.id, name: l.name, lat: l.lat, lng: l.lng, tags: l.tags, description: l.description,
    photos: l.photos.map((p) => mediaUrl(p.url)),
    addedBy: l.owner_username, created: day(l.created_at),
    verifiedOn: l.verified_at ? day(l.verified_at) : undefined,
    verifiedBy: l.verified_by ?? undefined,
    notes: l.notes.map((n) => ({ by: n.username, text: n.text, date: day(n.created_at) })),
  };
}

function mapFromApi(m: ApiMap, previous?: MapData): MapData {
  return {
    id: String(m.id), title: m.title, description: m.description, category: m.category,
    visibility: m.visibility as Visibility, ownerId: userId(m.owner_id), sharedWith: m.shared_with,
    created: day(m.created_at), updated: day(m.updated_at),
    places: previous?.places ?? [], loaded: previous?.loaded ?? false,
    placeCount: m.place_count, contributorCount: m.contributor_count, pinsPreview: m.pins,
    sharedWithMe: previous?.sharedWithMe,
  };
}

function reportFromApi(r: ApiReport): Report {
  return {
    id: String(r.id), mapId: '', placeId: r.location_id ?? 0, placeName: r.place_name, mapTitle: r.map_title ?? '',
    kind: REPORT_KIND_FROM_API[r.kind] ?? 'Other', by: r.reporter_username, note: r.note,
    date: day(r.created_at), status: r.status as Report['status'],
  };
}

/* ---------- small helpers for updating the cache ---------- */

const upsertUser = (users: User[], user: User) => [...users.filter((u) => u.id !== user.id), user];

/** Add or refresh maps (and their owners), keeping places that were already fetched. */
function mergeMaps(apiMaps: ApiMap[], mark?: (m: MapData) => MapData) {
  const s = getState();
  let users = s.users;
  const maps = [...s.maps];
  for (const am of apiMaps) {
    // Owners are only added when unknown. A user we already have (above all the signed-in one, whose role and
    // email came from /auth/me) must not be replaced by the thinner owner info a map carries.
    if (!users.some((u) => u.id === userId(am.owner_id))) {
      users = upsertUser(users, {
        id: userId(am.owner_id), username: am.owner_username, name: am.owner_name,
        email: '', passHash: '', bio: '', role: 'member',
      });
    }
    const index = maps.findIndex((m) => m.id === String(am.id));
    const merged = mapFromApi(am, index >= 0 ? maps[index] : undefined);
    const next = mark ? mark(merged) : merged;
    if (index >= 0) maps[index] = next;
    else maps.push(next);
  }
  commit({ ...s, users, maps });
}

/** Forget everything private (and reports) when the person signing in or out changes. */
function resetPrivateCache(extra: Partial<State> = {}) {
  const s = getState();
  commit({
    ...s,
    maps: s.maps.filter((m) => m.visibility === 'public').map((m) => ({ ...m, sharedWithMe: false, sharedWith: [] })),
    reports: [],
    ...extra,
  });
}

/* ---------- sign in and out ---------- */

async function startSession() {
  const me = userFromApi(await request<ApiUser>('/auth/me'));
  const s = getState();
  commit({ ...s, users: upsertUser(s.users, me), sessionUserId: me.id });
  resetPrivateCache();
}

/** Runs once when the app starts: if a token is saved, check it with the server. */
export async function initAuth() {
  try {
    if (getToken()) await startSession();
  } catch (e) {
    // An expired or invalid token means signed out. A server that is down just leaves the page as a guest.
    if (e instanceof ApiError && e.status === 401) clearToken();
  } finally {
    setAuthReady(true);
  }
}

export async function signUp(input: { username: string; email: string; password: string }) {
  await request<ApiUser>('/auth/signup', {
    json: { email: input.email.trim().toLowerCase(), password: input.password, username: input.username.trim() || undefined },
  });
  await signIn(input.email, input.password);
}

export async function signIn(email: string, password: string) {
  const { access_token } = await request<{ access_token: string }>('/auth/login', {
    json: { email: email.trim().toLowerCase(), password },
  });
  setToken(access_token);
  await startSession();
}

export function signOut() {
  clearToken();
  resetPrivateCache({ sessionUserId: null });
}

export async function updateProfile(input: { name: string; email: string; bio: string }) {
  const s = getState();
  const me = s.users.find((u) => u.id === s.sessionUserId);
  if (!me) throw new Error('Please sign in first.');
  if (input.email.trim().toLowerCase() !== me.email.toLowerCase()) {
    throw new Error('Changing your email is not available yet: the server has no endpoint for it.');
  }
  const updated = userFromApi(await request<ApiUser>('/auth/me', { method: 'PATCH', json: { name: input.name, bio: input.bio } }));
  commit({ ...getState(), users: upsertUser(getState().users, updated) });
}

export async function changePassword(): Promise<void> {
  throw new Error('Changing your password is not available yet: the server has no endpoint for it.');
}

/* ---------- loading what the pages show ---------- */

export async function loadPublicMaps() {
  mergeMaps((await request<{ items: ApiMap[] }>('/maps')).items);
}

/** My own maps, and private maps others shared with me. */
export async function loadMyMaps() {
  const [mine, shared] = await Promise.all([
    request<{ items: ApiMap[] }>('/maps?scope=mine'),
    request<{ items: ApiMap[] }>('/maps?scope=shared'),
  ]);
  const s = getState();
  commit({ ...s, maps: s.maps.map((m) => ({ ...m, sharedWithMe: false })) }); // the server list decides this again
  mergeMaps(mine.items);
  mergeMaps(shared.items, (m) => ({ ...m, sharedWithMe: true }));
}

/** One map with all its places. Resolves to "missing" when it does not exist or may not be seen. */
export async function loadMap(id: string): Promise<'ready' | 'missing'> {
  try {
    const [map, locations] = await Promise.all([
      request<ApiMap>(`/maps/${encodeURIComponent(id)}`),
      request<{ items: ApiLocation[] }>(`/maps/${encodeURIComponent(id)}/locations`),
    ]);
    mergeMaps([map], (m) => ({
      ...m, places: locations.items.map(placeFromApi), loaded: true, placeCount: locations.items.length,
    }));
    return 'ready';
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return 'missing';
    throw e;
  }
}

export async function loadReports() {
  const [open, dismissed, removed] = await Promise.all(
    (['open', 'dismissed', 'removed'] as const).map((status) => request<{ items: ApiReport[] }>(`/reports?status=${status}`)),
  );
  commit({ ...getState(), reports: [...open.items, ...dismissed.items, ...removed.items].map(reportFromApi) });
}

/* ---------- changing things ---------- */

export async function createMap(input: { title: string; description: string; category: string; visibility: Visibility }): Promise<string> {
  const map = await request<ApiMap>('/maps', { json: input });
  mergeMaps([map], (m) => ({ ...m, places: [], loaded: true }));
  return String(map.id);
}

export async function shareMap(mapId: string, email: string) {
  mergeMaps([await request<ApiMap>(`/maps/${encodeURIComponent(mapId)}/shares`, { json: { email } })]);
}

export async function unshareMap(mapId: string, email: string) {
  mergeMaps([await request<ApiMap>(`/maps/${encodeURIComponent(mapId)}/shares/${encodeURIComponent(email)}`, { method: 'DELETE' })]);
}

/** The app keeps photos as small JPEG data URLs; the server wants the file itself. */
async function uploadPhoto(locationId: number, dataUrl: string) {
  const blob = await (await fetch(dataUrl)).blob();
  const form = new FormData();
  form.append('file', blob, 'photo.jpg');
  await request(`/locations/${locationId}/photos`, { form });
}

export async function addPlace(
  mapId: string,
  input: { name: string; description: string; lat: number; lng: number; tags: string[]; photo?: string },
): Promise<number> {
  const created = await request<ApiLocation>('/locations', {
    json: {
      name: input.name, description: input.description, lat: input.lat, lng: input.lng,
      tags: input.tags, map_id: Number(mapId),
    },
  });
  // The place exists now. If only the photo fails, say so but keep the place.
  try {
    if (input.photo) await uploadPhoto(created.id, input.photo);
  } catch (e) {
    await loadMap(mapId);
    throw new Error(`The place was added, but its photo could not be uploaded: ${e instanceof Error ? e.message : 'unknown error'}`);
  }
  await loadMap(mapId);
  return created.id;
}

/** Used when a new submission is recognised as an existing place. */
export async function addToExistingPlace(mapId: string, placeId: number, input: { photo?: string; note?: string }) {
  if (input.note?.trim()) await request(`/locations/${placeId}/notes`, { json: { text: input.note.trim() } });
  if (input.photo) await uploadPhoto(placeId, input.photo);
  await loadMap(mapId);
}

export async function addPhoto(mapId: string, placeId: number, photo: string) {
  await uploadPhoto(placeId, photo);
  await loadMap(mapId);
}

export async function verifyPlace(mapId: string, placeId: number) {
  await request(`/locations/${placeId}/verify`, { method: 'POST' });
  await loadMap(mapId);
}

export async function reportPlace(_mapId: string, placeId: number, kind: ReportKind, note: string) {
  await request(`/locations/${placeId}/reports`, { json: { kind: REPORT_KIND_TO_API[kind], note } });
}

export async function resolveReport(reportId: string, action: 'dismissed' | 'removed') {
  await request(`/reports/${reportId}/resolve`, { json: { action: action === 'dismissed' ? 'dismiss' : 'remove' } });
  await loadReports();
}
