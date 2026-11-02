import type { MapData, Place, State, User } from './types';

export const fmtCoords = (lat: number, lng: number, digits = 4) =>
  `${Math.abs(lat).toFixed(digits)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(digits)}° ${lng >= 0 ? 'E' : 'W'}`;

export const sessionUser = (s: State): User | null => s.users.find((u) => u.id === s.sessionUserId) ?? null;

/** Public maps are visible to everyone. Private maps only to the owner and people it is shared with. */
export function canView(map: MapData, user: User | null): boolean {
  if (map.visibility === 'public') return true;
  if (!user) return false;
  return map.ownerId === user.id || map.sharedWith.includes(user.email.toLowerCase());
}

export function findMap(s: State, id: string | undefined): MapData | undefined {
  const m = s.maps.find((x) => x.id === id);
  return m && canView(m, sessionUser(s)) ? m : undefined;
}

export const ownerName = (s: State, m: MapData) => s.users.find((u) => u.id === m.ownerId)?.name ?? 'Unknown';

export function contributorCount(s: State, m: MapData) {
  const owner = s.users.find((u) => u.id === m.ownerId)?.username;
  return new Set([...(owner ? [owner] : []), ...m.places.map((p) => p.addedBy)]).size;
}

export type MapCard = {
  id: string;
  title: string;
  blurb: string;
  category: string;
  places: number;
  contributors: number;
  updated: string;
  lat: number;
  lng: number;
  /** Places, used to draw the map tile. */
  pins: { lat: number; lng: number; name: string }[];
};

export function toCard(s: State, m: MapData): MapCard {
  const n = Math.max(m.places.length, 1);
  return {
    id: m.id,
    title: m.title,
    blurb: m.description,
    category: m.category,
    places: m.places.length,
    contributors: contributorCount(s, m),
    updated: m.updated,
    lat: m.places.reduce((a, p) => a + p.lat, 0) / n,
    lng: m.places.reduce((a, p) => a + p.lng, 0) / n,
    pins: m.places.map((p) => ({ lat: p.lat, lng: p.lng, name: p.name })),
  };
}

export const publicMaps = (s: State) => s.maps.filter((m) => m.visibility === 'public');

const distanceKm = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(bLat - aLat) / 2) ** 2 + Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(r(bLng - aLng) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};

/**
 * Nearby or similarly named places. Stands in for the PostGIS proximity + pgvector
 * similarity check in the real backend.
 */
export function findPossibleDuplicates(places: Place[], lat: number, lng: number, text: string) {
  const words = new Set(text.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  return places
    .map((place) => {
      const km = distanceKm(lat, lng, place.lat, place.lng);
      const shared = place.name.toLowerCase().split(/\W+/).filter((w) => words.has(w)).length;
      return { place, distanceKm: km, shared };
    })
    .filter((m) => m.distanceKm < 0.5 || (m.distanceKm < 5 && m.shared > 0))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/** Keyword rules standing in for the Gemini tag suggestions. Public maps may only use these. */
export function suggestTags(text: string): string[] {
  const t = text.toLowerCase();
  const rules: [RegExp, string][] = [
    [/fort|qila|quila|palace|mahal|haveli|ruin|heritage/, 'Heritage'],
    [/gurdwara|gurudwara|mandir|temple|masjid|church/, 'Place of worship'],
    [/garden|park|lake|sanctuary|bagh|forest/, 'Park'],
    [/campus|university|college|institute|school/, 'Campus'],
    [/food|stall|chai|cafe|market|bazaar|dhaba/, 'Street food'],
    [/view|sunset|sunrise/, 'Viewpoint'],
    [/trail|path|shortcut/, 'Trail'],
  ];
  const found = rules.filter(([re]) => re.test(t)).map(([, tag]) => tag);
  return found.length ? found : ['Landmark', 'Community spot'];
}
