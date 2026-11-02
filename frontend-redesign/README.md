# PinPoint frontend redesign

> This is a separate, standalone take on the frontend (new look, mock data in the browser). It does **not** replace or change `../frontend`, which is the version wired to the backend. It does not call the API: all data lives in `localStorage` behind `src/store/api.ts`, whose functions are shaped to map onto the planned endpoints.

React + TypeScript + Tailwind + Leaflet. Colors, fonts and shadows are defined in `tailwind.config.js`. Wording rules are in `./GLOSSARY_AND_SCREENS.md`.

```bash
npm install
npm run dev
```

## How data works today

There is no backend yet. All data lives in this browser's `localStorage` (key `pinpoint.state.v1`) behind `src/store/api.ts`. Each function in that file is meant to become one FastAPI endpoint; pages only talk to `api.ts` and the `useAppState()` hook.

- `src/store/seed.ts`: sample users, maps, places and reports.
- `src/store/api.ts`: sign up / in, maps, places, photos, verify, report, share, moderation.
- `src/store/helpers.ts`: access rule (`canView`), duplicate check and tag suggestions (stand-ins for PostGIS/pgvector and Gemini).
- Profile page → "Reset demo data" restores the seed.

## Demo accounts (seed data only)

| Email | Password | Role |
|---|---|---|
| marcus@example.com | demo-password-1 | moderator |
| ananya@example.com | demo-password-1 | member |

## What is real and what is not

Real in the browser: accounts (salted PBKDF2 password hashes, demo only), public browsing without an account (sign-in needed to change anything), public/private access, creating maps, adding places with resized photos, EXIF location, duplicate check and merge, verify, report, moderator queue, sharing private maps by email.

Not real: server, Argon2id/JWT auth, AI tagging (keyword rules), pgvector similarity (name + distance rules), email invites (access is by matching email), cross-device sync.
