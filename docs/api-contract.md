# PinPoint API Contract

This file is the agreement between the backend (Tanmay) and the frontend (Saneh).
Both sides build against it in parallel: the backend implements it, and the frontend
mocks it until the real endpoint is merged.

**Changing the contract:** open a PR that edits this file. Both people must approve it
before either side codes against the change.

| Version | Date | Change |
|---|---|---|
| 1 | 2026-10-11 | Initial contract: auth (Sprint 1), locations (Sprint 2), create location and photos (Sprint 3) |
| 2 | 2026-11-02 | **Proposed, needs approval from both.** Adds maps, extra place fields (map, verify, notes, reports), moderators and profile fields. Everything in version 1 still works. See [Version 2 additions](#version-2-additions-proposed). |

---

## Conventions

- **Base URL:** every route below lives under `/api/v1`.
  In development that is `http://localhost:8000/api/v1`. The frontend reads the host from `VITE_API_URL`.
- **Format:** JSON request and response bodies, except photo upload (multipart).
- **Auth:** protected routes need the header `Authorization: Bearer <access_token>`.
  - **Required:** a missing or invalid token returns `401`.
  - **Optional:** the route works without a token. With a valid token, the response also includes the caller's private data.
- **IDs:** integers.
- **Timestamps:** ISO 8601 in UTC, for example `"2026-10-11T09:30:00Z"`.
- **Coordinates:** WGS 84 decimal degrees, sent as separate `lat` and `lng` fields. The API never exposes raw PostGIS geometry.

### Errors

FastAPI's default shape:

```json
{ "detail": "Email already registered" }
```

Validation errors (`422`) list each failing field:

```json
{
  "detail": [
    { "loc": ["body", "name"], "msg": "String should have at least 1 character", "type": "string_too_short" }
  ]
}
```

| Status | Meaning |
|---|---|
| `400` | Request is valid but not allowed (for example, email already registered) |
| `401` | Token missing, invalid or expired; or wrong login details |
| `403` | Logged in, but not the owner of the resource |
| `404` | Not found, or private and not yours. Private places return 404, not 403, so their existence isn't revealed. |
| `413` | Uploaded file too large |
| `415` | Uploaded file type not allowed |
| `422` | Validation failed (see shape above) |

---

## Schemas

### User

```json
{ "id": 3, "email": "saneh@example.com", "created_at": "2026-10-11T09:30:00Z" }
```

The password hash is never returned.

### Location

Full detail, returned by `GET /locations/{id}` and `POST /locations`.

```json
{
  "id": 42,
  "name": "Library reading room",
  "description": "Quiet, open till 11 pm",
  "lat": 30.3564,
  "lng": 76.3647,
  "visibility": "public",
  "tags": ["study", "wifi"],
  "photos": [{ "id": 7, "url": "/media/photos/7.jpg" }],
  "owner_id": 3,
  "created_at": "2026-10-11T09:30:00Z"
}
```

### LocationPin

The lightweight version used to draw pins on the map.

```json
{
  "id": 42,
  "name": "Library reading room",
  "lat": 30.3564,
  "lng": 76.3647,
  "visibility": "public",
  "tags": ["study", "wifi"]
}
```

### LocationCreate

| Field | Type | Rules |
|---|---|---|
| `name` | string | Required, 1–120 characters after trimming |
| `description` | string | Optional, default `""`, 0–2000 characters |
| `lat` | number | Required, −90 to 90 |
| `lng` | number | Required, −180 to 180 |
| `visibility` | string | Required, `"public"` or `"private"` |
| `tags` | string[] | Optional, default `[]`, up to 10 tags, each 1–30 characters; stored lowercase and trimmed |

### Photo

```json
{ "id": 7, "url": "/media/photos/7.jpg" }
```

`url` may be relative (local storage now) or absolute (S3 later). The frontend should handle both.

---

## Endpoints

### Sprint 1: Auth

#### `GET /health`
- **Auth:** none
- **200:** `{ "status": "ok" }`

#### `POST /auth/signup`
- **Auth:** none
- **Body:** `{ "email": "saneh@example.com", "password": "at-least-8-chars" }`
  - `email` must be a valid email address; `password` must be 8+ characters.
- **201:** `User`
- **400:** `{ "detail": "Email already registered" }`
- **422:** invalid email or short password

#### `POST /auth/login`
- **Auth:** none
- **Body:** `{ "email": "...", "password": "..." }`
- **200:** `{ "access_token": "<jwt>", "token_type": "bearer" }`
- **401:** `{ "detail": "Invalid email or password" }`

#### `GET /auth/me`
- **Auth:** required
- **200:** `User`
- **401:** `{ "detail": "Invalid or expired token" }`

Logout is handled on the frontend only, by deleting the stored token. No endpoint is needed yet.

### Sprint 2: Locations (read)

#### `GET /locations?bbox=west,south,east,north`
- **Auth:** optional
- **Query:** `bbox` is required. It holds four comma-separated numbers in the order
  `west,south,east,north` (min lng, min lat, max lng, max lat). This matches Leaflet's
  `map.getBounds().toBBoxString()`, so the frontend can pass it through unchanged.
- **200:**
  ```json
  { "items": [ /* LocationPin, ... */ ] }
  ```
  - Logged out: public places inside the box.
  - Logged in: public places plus the caller's own private places inside the box.
  - At most 500 items, newest first.
- **422:** `bbox` missing or malformed

#### `GET /locations/{id}`
- **Auth:** optional
- **200:** `Location`
- **404:** the place doesn't exist, or it is private and the caller isn't the owner

### Sprint 3: Add a place

#### `POST /locations`
- **Auth:** required
- **Body:** `LocationCreate`
- **201:** `Location` (with `photos: []`)
- **401 / 422** as above

#### `POST /locations/{id}/photos`
- **Auth:** required; caller must own the place
- **Body:** `multipart/form-data` with one field, `file`
  - JPEG, PNG or WebP only; 5 MB max
- **201:** `Photo`
- **403:** not the owner
- **404:** place not found (same visibility rule as `GET /locations/{id}`)
- **413:** file larger than 5 MB
- **415:** file type not allowed

The frontend uploads photos one at a time after `POST /locations` returns the new `id`.

---

## Version 2 additions (proposed)

Why: the proposal's "Public Maps" and "My Maps" are *named collections of places* (the frontend has
Create map, My Maps, Map view). Version 1 only has flat places, so there is nothing to attach a map to.
Version 2 adds that, plus the actions the interface needs (verify, add a note, report, moderate).

**Nothing here changes a version 1 route or field.** One v1 rule is relaxed and is marked **(changed)**.
Version 2 keeps the same conventions (integer IDs, UTC timestamps, `lat`/`lng`, FastAPI errors).

### Changed and new fields

**User** gains `username`, `name`, `bio`, `role`:

```json
{ "id": 3, "email": "saneh@example.com", "username": "saneh", "name": "Saneh", "bio": "", "role": "member", "created_at": "2026-10-11T09:30:00Z" }
```

- `username`: 3 to 30 characters, letters, digits, `_` and `-`, unique (case-insensitive). If not given at signup, it is the part of the email before `@`, made unique with a number if needed.
- `name`: defaults to `username`. `bio`: up to 180 characters. `role`: `"member"` or `"moderator"`.
- Moderators are set by the server setting `MODERATOR_EMAILS` (comma-separated emails). There is no admin screen yet.

**Map**:

```json
{
  "id": 5, "title": "Patiala heritage", "description": "Forts and palaces", "category": "Heritage",
  "visibility": "public", "owner_id": 3, "owner_username": "saneh", "owner_name": "Saneh",
  "place_count": 3, "contributor_count": 2,
  "pins": [{ "lat": 30.3241, "lng": 76.4031, "name": "Qila Mubarak" }],
  "shared_with": [], "created_at": "2026-10-11T09:30:00Z", "updated_at": "2026-10-12T10:00:00Z"
}
```

`pins` lists up to 12 places, oldest first, for drawing the map card. `shared_with` is only filled for the owner of a private map.

**Location** gains `map_id`, `owner_username`, `verified_at`, `verified_by`, `notes`:

```json
{
  "id": 42, "map_id": 5, "name": "Qila Mubarak", "description": "Fort in the old city.",
  "lat": 30.3241, "lng": 76.4031, "visibility": "public", "tags": ["heritage"],
  "photos": [{ "id": 7, "url": "/media/photos/7.jpg" }],
  "notes": [{ "id": 1, "username": "ananya", "text": "Best at 8 AM.", "created_at": "2026-10-12T10:00:00Z" }],
  "owner_id": 3, "owner_username": "saneh", "verified_at": "2026-10-12T10:00:00Z", "verified_by": "ananya",
  "created_at": "2026-10-11T09:30:00Z"
}
```

`verified_at` and `verified_by` are `null` until someone confirms the place.

**LocationCreate** gains `map_id` (optional). When `map_id` is given, `visibility` is optional and is copied
from the map. When it is missing, `visibility` is required, as in version 1.

### New endpoints

| Method and path | Auth | What it does |
|---|---|---|
| `PATCH /auth/me` | required | Body `{ "name"?, "bio"? }`. Returns `User`. |
| `GET /maps?scope=public\|mine\|shared&q=&category=` | optional (`mine` and `shared` need a token) | `{ "items": [Map] }`, newest updated first. `public` is the default. `shared` = private maps others shared with my email. |
| `POST /maps` | required | Body `{ "title", "description"?, "category"?, "visibility" }`. Returns `Map` (201). Title 3 to 72 characters. |
| `GET /maps/{id}` | optional | `Map`. `404` if private and the caller is not the owner or shared with. |
| `GET /maps/{id}/locations` | optional | `{ "items": [Location] }`, oldest first. Same visibility rule as the map. |
| `POST /maps/{id}/shares` | required, owner | Body `{ "email" }`. Private maps only. Returns `Map`. `400` for a public map, yourself or a duplicate. |
| `DELETE /maps/{id}/shares/{email}` | required, owner | Returns `Map`. |
| `POST /locations/{id}/notes` | required | Body `{ "text" }` (1 to 500). Returns `Location`. Used when a new submission turns out to be an existing place. |
| `POST /locations/{id}/verify` | required | Sets `verified_at` and `verified_by` to now and the caller. Returns `Location`. |
| `POST /locations/{id}/reports` | required | Body `{ "kind", "note"? }`. `kind` is `wrong_location`, `no_longer_exists`, `duplicate`, `spam` or `other`. Returns `Report` (201). |
| `GET /reports?status=open\|dismissed\|removed` | required, moderator | `{ "items": [Report] }`, newest first. `403` for a non-moderator. |
| `POST /reports/{id}/resolve` | required, moderator | Body `{ "action": "dismiss" \| "remove" }`. `remove` deletes the place and closes every open report about it. Returns `Report`. |

**Report**:

```json
{ "id": 9, "location_id": 42, "place_name": "Qila Mubarak", "map_title": "Patiala heritage", "kind": "wrong_location",
  "note": "Pin looks off", "reporter_username": "ananya", "status": "open", "created_at": "2026-10-12T10:00:00Z" }
```

`location_id` becomes `null` once the place is removed. `place_name` and `map_title` are kept so the report still makes sense.

### Changed rule **(changed)**

- `POST /locations/{id}/photos` (version 1: owner only) now allows **any signed-in user who can see the place**.
  The reason is the duplicate flow: when someone finds an existing place, their photo is added to it instead of
  creating a copy. The `403` case therefore no longer applies; `404` still covers places the caller cannot see.

### Rules that stay on the server

- Visibility: a private map, and every place in it, is invisible (`404`) to everyone except the owner and the
  emails it is shared with. Private places never appear in `GET /locations` or `GET /maps` for anyone else.
- A place added to a public map is public. A place added to a private map is private.
- Only a signed-in user can add, verify, report or share anything. Reading public maps and places needs no account.

### Not in version 2 (still on the frontend)

Tag suggestions and the "is this a duplicate?" check run in the browser for now, using the places already
fetched. They move to the server (embeddings and PostGIS) in a later version.

---

## Frontend mocks

While an endpoint isn't merged yet, the frontend uses mock data in `frontend/src/mocks/`,
shaped exactly as above. Set `VITE_USE_MOCKS=true` to use mocks and `false` to call the real API.
If the real API returns something different from this file, fix the side that doesn't
match the contract. Don't quietly adapt the other side.
