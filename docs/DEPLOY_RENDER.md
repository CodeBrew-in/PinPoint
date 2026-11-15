# Deploying PinPoint for free on Render

What you get, at no cost:

| Part | Where | Notes |
|---|---|---|
| Website (frontend) | Render static site | always on |
| API (backend) | Render free web service, Singapore | sleeps after 15 minutes without visitors; the first visit after that takes about a minute |
| Database and photos | Neon free Postgres | 1 GB, never expires. Photos live in the same database, so they survive restarts. |
| Updates | automatic | every time the GitHub checks pass on `main`, Render redeploys |

Do the steps in order. Never paste a password or connection string into a chat or an issue: type it only into the Render or Neon web page.

---

## Step 1: make the database (Neon), 5 minutes

1. Go to https://neon.com and sign up (GitHub login works).
2. **Create project**: name `pinpoint`, pick the region closest to India (Singapore if offered), keep the newest Postgres version.
3. On the project page click **Connect**. Turn **Connection pooling OFF** (we want the *direct* connection).
4. Copy the connection string. It looks like `postgresql://user:password@ep-something.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`. Keep that tab open: you paste it into Render in step 3.

## Step 2: put the code on `main`

Render deploys the `main` branch. After the latest pull request is merged into `develop`, open a pull request from `develop` into `main` on GitHub and merge it. (Until then Render has nothing to deploy.)

## Step 3: create the two services (Render), 10 minutes

1. Go to https://render.com and sign up with GitHub. Allow it to see the repository `CodeBrew-in/PinPoint`.
2. Click **New** then **Blueprint**, pick the repository, branch `main`. Render reads `render.yaml` and lists two services: `codebrew-pinpoint-api` and `codebrew-pinpoint`.
3. It asks for the values marked secret:
   - `DATABASE_URL`: paste the Neon connection string from step 1.
   - `MODERATOR_EMAILS`: leave empty for now (see "Make yourself a moderator" below).
   - `VITE_OPERATOR_NAME`, `VITE_CONTACT_EMAIL`, `VITE_GRIEVANCE_OFFICER`: who runs the site, and a contact address. They appear on the Privacy, Terms and Contact pages. Use your real details.
4. Click **Apply**. The first build takes a few minutes.
5. If Render says a name is taken, rename the service, then change the two addresses in `render.yaml` marked "keep in step" (the `FRONTEND_ORIGINS` value, `VITE_API_URL` and the two web addresses in the content-security-policy line) and push again.

## Step 4: check the real addresses

In the Render dashboard open each service and copy its address (`https://....onrender.com`).

- The **API** address plus `/api/v1/health` should show `{"status":"ok"}` (the first request can take a minute).
- The **website** address should show PinPoint.

If the website cannot reach the API, the two addresses in `render.yaml` do not match the real ones: fix them as described in step 3.5.

## Step 5: test it

From your computer, in the project folder:

```bash
LIVE=1 API=https://YOUR-API.onrender.com/api/v1 WEB=https://YOUR-SITE.onrender.com bash scripts/smoke-test.sh
```

It signs up two throw-away accounts, adds places and a photo, checks the privacy rules, and deletes the accounts again. Then open the website in a second browser, sign up as a normal person, add a place and a photo, and refresh.

## Make yourself a moderator

The moderator role is given by e-mail address, and the account must exist first.

1. Sign up on the website with your e-mail.
2. In Render open the API service, **Environment**, set `MODERATOR_EMAILS` to your address (several: separate with commas), and save. Render restarts the service.
3. Sign in again: you now see **Review** in the menu.

## Everyday running

- **Deploy a change:** merge a pull request into `main`. When the CI checks pass, Render redeploys both services by itself.
- **Roll back:** Render dashboard, the service, **Events**, find the earlier deploy and **Rollback**.
- **Stop new accounts at once:** set `SIGNUPS` to `closed` in the API service's Environment. Set it back to `open` to allow them again.
- **See errors:** Render dashboard, the service, **Logs**.
- **Keep it awake (optional):** a free uptime pinger such as UptimeRobot can open `https://YOUR-API.onrender.com/api/v1/health` every 5 minutes. One always-awake free service fits the monthly free hours.

## Backups (do this weekly at first)

Everything, including photos, is in the Neon database. With Docker installed:

```bash
DATABASE_URL='postgresql://...your Neon string...' bash scripts/backup-neon.sh
```

It writes `backups/pinpoint-<time>.dump` (this folder is never committed). Copy it somewhere off your computer. Practise restoring it once into a **second, empty** Neon project with `scripts/restore-neon.sh`.

## Limits to know about

- The first visit after 15 idle minutes waits about a minute for the API to wake.
- Photos share Neon's 1 GB with everything else; each photo is shrunk to at most 1600 pixels, so roughly 3,000 fit.
- Photo links expire after 6 to 12 hours and are renewed whenever a page is loaded.
- Without e-mail set up there is no "forgot password", and e-mail addresses are not confirmed. See `docs/EMAIL_SETUP.md` once it exists.
- Changing `SECRET_KEY` logs everybody out.
