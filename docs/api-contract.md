# PinPoint API Contract

This file is the agreement between the backend (Tanmay) and the frontend (Saneh).
Both sides build against it in parallel: the backend implements it, and the frontend
mocks it until the real endpoint is merged.

**Changing the contract:** open a PR that edits this file. Both people must approve it
before either side codes against the change.

| Version | Date | Change |
|---|---|---|
| 1 | 2026-10-11 | Initial contract: auth (Sprint 1), locations (Sprint 2), create location and photos (Sprint 3) |

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

## Frontend mocks

While an endpoint isn't merged yet, the frontend uses mock data in `frontend/src/mocks/`,
shaped exactly as above. Set `VITE_USE_MOCKS=true` to use mocks and `false` to call the real API.
If the real API returns something different from this file, fix the side that doesn't
match the contract. Don't quietly adapt the other side.
