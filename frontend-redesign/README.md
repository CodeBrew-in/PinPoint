# PinPoint frontend redesign

A separate take on the frontend (new look). It does **not** replace `../frontend`; both can run side by side.
It works in two modes, chosen by one setting:

| Mode | How | Data |
|---|---|---|
| **Backend** | `VITE_API_URL` is set | Accounts, maps, places, photos, verify, reports and moderation use the real API (`docs/api-contract.md`, version 2). |
| **Browser demo** | `VITE_API_URL` is empty | No backend needed. Everything lives in this browser's `localStorage`, with Patiala sample data. This is what the shared Vercel link runs. |

React + TypeScript + Tailwind + Leaflet. Colors, fonts and shadows are defined in `tailwind.config.js`. Wording rules are in `./GLOSSARY_AND_SCREENS.md`.

## Run with the backend (Docker)

From the repository root:

```bash
docker compose -f docker-compose.yml -f docker-compose.redesign.yml up --build
```

Then load the demo data once, and open http://localhost:5174:

```bash
docker compose -f docker-compose.yml -f docker-compose.redesign.yml exec backend python -m app.seed
```

Demo accounts (password `demo-password-1`): `marcus@example.com` (moderator, sees the Review page) and `ananya@example.com`.
Anyone can also create an account on the sign-up page.

## Run without Docker

```bash
npm install
npm run dev                                  # browser demo, nothing else needed
```

To use a backend you started yourself, copy `.env.example` to `.env` (it points at `http://localhost:8000/api/v1`)
and start `npm run dev` again. The backend must allow this origin in `FRONTEND_ORIGINS` (default `http://localhost:5173`).

## How it is built

Pages never call the network. They read from one store and call functions in `src/store/api.ts`.

- `src/store/api.ts`: every action (sign in, create map, add place, and so on). In backend mode each one calls `src/store/remote.ts`; otherwise it works on `localStorage`.
- `src/store/remote.ts`: the backend calls. The store acts as a cache: pages load what they need, and every change goes to the server first and then refreshes that part of the cache.
- `src/lib/http.ts`: `fetch` wrapper, the saved login token, and `VITE_API_URL`.
- `src/store/useLoad.ts`: runs a loader when a page opens and reports loading or error.
- `src/store/seed.ts`: the browser demo's sample data.
- `src/store/helpers.ts`: tag suggestions and the "is this a duplicate?" check. These still run in the browser in both modes.

## What the backend does not do yet

Shown differently in backend mode:

- **Change password and change email:** the server has no endpoints for them, so those fields are hidden or disabled.
- **"Reset demo data"** is hidden (there is nothing local to reset).
- **Tag suggestions and the duplicate check** are still simple browser rules (keywords, name and distance), not AI or PostGIS.
- **Password reset ("Forgot password?")** does not exist yet.
- **Email invites:** sharing a private map by email gives access to whoever signs up with that address; no email is sent.

## Browser demo notes

Demo accounts (seed data only): `marcus@example.com` (moderator) and `ananya@example.com`, password `demo-password-1`.
Passwords there are stored as salted PBKDF2 hashes in `localStorage`, which is only fine for a demo.
