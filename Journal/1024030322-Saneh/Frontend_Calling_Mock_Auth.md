# Frontend Calling the Mock Auth Backend

## Error / Problem

Login always "worked", even though the real JWT authentication had already been built.

The Login and Signup pages sent requests to `http://localhost:8000/login` and `http://localhost:8000/signup`.
Those routes belonged to an early **mock** backend, which was later moved into `backend/app/models/main.py`.
The mock login:

- accepted any email and password (except `wrong@pinpoint.com`)
- returned a fake token: `"fake-super-secret-jwt-token"`

The real routes were `/auth/login` and `/auth/signup` in `backend/app/api/auth.py`, but nothing on the frontend called them.

A second bug was hidden behind this. After login, the page ran:

```tsx
alert(response.data.message);
```

The real `/auth/login` only returns `access_token` and `token_type`, with no `message` field.
After switching to the real route, the alert would have shown `undefined`, and the token was never saved anywhere.

### Common Causes

- A mock built early for testing was never removed once the real feature existed.
- The backend URL was hardcoded in each page (`http://localhost:8000/...`), so changing it meant editing every file.
- The frontend and backend never agreed on endpoint paths or response shapes.

## Solution

### Implemented Solutions

- Deleted the mock `backend/app/models/main.py` (PR #18).
- Added one shared axios instance, `frontend/src/lib/api.ts`:
  - reads the backend URL from `VITE_API_URL`
  - adds `Authorization: Bearer <token>` to every request automatically
- Pointed Login and Signup at the real `/auth/login` and `/auth/signup`.
- On login, the JWT is saved to `localStorage` instead of showing an alert.
- Later (branch `feature/b2-auth-frontend`): added `AuthProvider`, which checks the token with `/auth/me`,
  and `getErrorMessage()`, so errors from the API are always readable.
- Wrote `docs/api-contract.md` (PR #19) so both sides use the same paths and JSON shapes.

### Result

Signup creates a real user in Postgres, and login returns a real JWT, which `/auth/me` accepts.
A wrong password now correctly returns `401 Invalid email or password`.
The old mock route `/login` returns `404`.

### Lesson

When a mock is replaced by the real thing, delete the mock in the same PR.
Agree on the API contract first, so the frontend never depends on routes that only exist in a mock.
