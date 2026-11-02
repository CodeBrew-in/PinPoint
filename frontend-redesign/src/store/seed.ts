import type { MapData, Place, Report, State, User } from './types';

/**
 * Demo accounts (password for both: demo-password-1):
 *   marcus@example.com  (moderator)
 *   ananya@example.com  (member)
 *
 * Place names and coordinates are real Patiala locations taken from OpenStreetMap.
 * Descriptions are deliberately plain. Replace them (and add photos) with your own.
 */
const PASS_HASH = '583e058ef1aa5ca952da97e6091e0d8c1fda04aa055cb0d31fe15618aff79fc4';

const users: User[] = [
  { id: 'u-marcus', username: 'marcus', name: 'Marcus Vance', email: 'marcus@example.com', passHash: PASS_HASH, bio: 'Demo moderator account.', role: 'moderator' },
  { id: 'u-ananya', username: 'ananya', name: 'Ananya Rao', email: 'ananya@example.com', passHash: PASS_HASH, bio: 'Demo member account.', role: 'member' },
];

const place = (
  id: number, name: string, lat: number, lng: number, tags: string[], addedBy: string,
  description: string, created: string, verifiedOn?: string,
): Place => ({ id, name, lat, lng, tags, description, photos: [], addedBy, created, verifiedOn, verifiedBy: verifiedOn ? addedBy : undefined, notes: [] });

const heritage: MapData = {
  id: 'patiala-heritage', title: 'Patiala heritage',
  description: 'Forts and palaces in and around Patiala.',
  category: 'Heritage', visibility: 'public', ownerId: 'u-marcus', sharedWith: [], created: '2026-09-02', updated: '2026-10-25',
  places: [
    place(1, 'Qila Mubarak', 30.3241, 76.4031, ['Heritage'], 'marcus', 'Fort in the old city.', '2026-09-02', '2026-10-12'),
    place(2, 'Moti Bagh Palace', 30.3055, 76.3941, ['Heritage'], 'ananya', 'Palace in the Moti Bagh area.', '2026-09-10', '2026-10-02'),
    place(3, 'Bahadurgarh Fort', 30.3642, 76.4712, ['Heritage'], 'ananya', 'Fort on the Patiala road, east of the city.', '2026-09-18'),
  ],
};

const faith: MapData = {
  id: 'patiala-faith', title: 'Temples and gurdwaras of Patiala',
  description: 'Places of worship around the city.',
  category: 'Faith', visibility: 'public', ownerId: 'u-ananya', sharedWith: [], created: '2026-09-20', updated: '2026-10-29',
  places: [
    place(1, 'Shri Kali Devi Mandir', 30.3367, 76.3942, ['Place of worship'], 'ananya', 'Temple on Mall Road.', '2026-09-20', '2026-10-20'),
    place(2, 'Gurudwara Dukh Niwarn Sahib', 30.3473, 76.3964, ['Place of worship'], 'marcus', 'Gurdwara in the north of the city.', '2026-09-24'),
    place(3, 'Gurudwara Shri Moti Bagh Sahib', 30.3108, 76.3894, ['Place of worship'], 'ananya', 'Gurdwara in the Moti Bagh area.', '2026-10-01'),
  ],
};

const campus: MapData = {
  id: 'patiala-campuses', title: 'Campuses of Patiala',
  description: 'Universities and institutes.',
  category: 'Campus', visibility: 'public', ownerId: 'u-marcus', sharedWith: [], created: '2026-10-05', updated: '2026-10-18',
  places: [
    place(1, 'Thapar Institute of Engineering and Technology', 30.3545, 76.3658, ['Campus'], 'marcus', 'Engineering university campus.', '2026-10-05', '2026-10-18'),
    place(2, 'Punjabi University', 30.3582, 76.4542, ['Campus'], 'ananya', 'University campus on Rajpura Road.', '2026-10-08'),
  ],
};

const weekend: MapData = {
  id: 'weekend-spots', title: 'Weekend spots', description: 'My own list. Not for sharing widely.',
  category: 'Nature', visibility: 'private', ownerId: 'u-marcus', sharedWith: ['ananya@example.com'], created: '2026-08-14', updated: '2026-10-22',
  places: [
    place(1, 'Bir Motibagh Wildlife Sanctuary', 30.2912, 76.3996, ['Nature', 'Quiet'], 'marcus', 'Wildlife sanctuary south of the city.', '2026-08-14'),
    place(2, 'Moti Bagh Palace', 30.3055, 76.3941, ['Heritage'], 'marcus', 'Walk around it in the evening.', '2026-09-01'),
  ],
};

const gettingAround: MapData = {
  id: 'getting-around', title: 'Getting around', description: 'Stops I use between campus and the station.',
  category: 'Other', visibility: 'private', ownerId: 'u-ananya', sharedWith: ['marcus@example.com'], created: '2026-09-09', updated: '2026-10-18',
  places: [
    place(1, 'Thapar Institute main area', 30.3545, 76.3658, ['Campus'], 'ananya', 'Where I start from.', '2026-09-09'),
    place(2, 'Patiala railway station', 30.3422, 76.4023, ['Transit'], 'ananya', 'Where I end up.', '2026-09-09'),
  ],
};

const reports: Report[] = [
  { id: 'r1', mapId: 'patiala-faith', placeId: 2, placeName: 'Gurudwara Dukh Niwarn Sahib', mapTitle: faith.title, kind: 'Wrong location', by: 'ananya', note: 'Pin looks a little off from the entrance.', date: '2026-10-28', status: 'open' },
  { id: 'r2', mapId: 'patiala-campuses', placeId: 1, placeName: 'Thapar Institute of Engineering and Technology', mapTitle: campus.title, kind: 'Other', by: 'ananya', note: 'Could the main gate be its own place?', date: '2026-10-27', status: 'open' },
];

export function seedState(): State {
  return structuredClone({
    users,
    maps: [heritage, faith, campus, weekend, gettingAround],
    reports,
    sessionUserId: null,
  });
}
