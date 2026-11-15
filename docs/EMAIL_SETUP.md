# Setting up e-mail (verification and "forgot password")

PinPoint sends two kinds of e-mail: a link to confirm a new account, and a link to reset a forgotten password.
On Render's free tier SMTP ports are blocked, so we send through the **Gmail API** (it uses HTTPS, which is allowed).
It sends from `thecodebrewcompany@gmail.com`, and costs nothing (Gmail allows a few hundred e-mails a day).

The code is already in the app. The site works without e-mail; these steps switch it on. Do them when I ask.
Never paste a secret into a chat, an issue or a repository file. Type or paste it only into Google's and Render's own pages.

---

## Part 1: Google Cloud (about 20 minutes)

Use the Gmail account that will send the mail (`thecodebrewcompany@gmail.com`).

1. Go to https://console.cloud.google.com and accept the terms if asked.
2. Top bar, project picker, **New project**: name it `pinpoint`, **Create**, and select it.
3. Menu, **APIs & Services**, **Library**: search **Gmail API**, open it, **Enable**.
4. Menu, **APIs & Services**, **OAuth consent screen** (or **Google Auth Platform**), **Get started**:
   - App name `PinPoint`, support e-mail: your address.
   - Audience: **External**.
   - Contact e-mail: your address. Accept the policy. **Create**.
5. On the **Audience** page, press **Publish app** (so the status is **In production**).
   Google may warn that the app is unverified: for an app that only sends mail from your own account that is fine.
   Why this matters: while the app is in "Testing", Google ends the sign-in after 7 days and e-mail would stop.
6. **Clients** (or **Credentials**), **Create client**, type **Desktop app**, name `pinpoint-mailer`, **Create**.
   Keep the **Client ID** and **Client secret** open; you need them in Part 2.
7. On **Data access**, **Add or remove scopes**, add `https://www.googleapis.com/auth/gmail.send` ("Send email on your behalf"), **Save**.

## Part 2: get the long-lived key (2 minutes, on your own computer)

In the project folder:

```bash
python scripts/gmail_token.py
```

It asks for the Client ID, the Client secret and the Gmail address, opens your browser, and you press **Allow**.
If Google says the app is not verified, press **Advanced**, then **Go to PinPoint (unsafe)**: that is your own app.
At the end it prints five lines. Keep that terminal open.

## Part 3: give them to the site (Render)

1. Render dashboard, the API service (`codebrew-pinpoint-api`), **Environment**.
2. Add the five lines the script printed: `EMAIL_PROVIDER`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`,
   `GMAIL_REFRESH_TOKEN`, `GMAIL_SENDER`. Also add `EMAIL_FROM` with the value `thecodebrewcompany@gmail.com`.
   (These are added here, not in `render.yaml`, so a redeploy never overwrites them.)
3. `APP_URL` is already set by `render.yaml` to your website's address (the links in the e-mails use it). Check it is right.
4. **Save**. Render restarts the service.

## Part 4: test, then turn the rule on

1. On the website, press **Forgot password?**, enter an address that has an account, and check the inbox (and spam).
2. Create a test account with a real address of yours: you get the confirmation e-mail and a banner on the site until you open the link.
3. When both work, set `EMAIL_VERIFICATION` to `required` in Render. From then on new accounts must confirm their address
   before adding maps or places, and a moderator needs a confirmed address. The server refuses to start if you set
   `required` while e-mail is not working, so you cannot lock everyone out by mistake.

## If something goes wrong

- **No e-mail arrives:** Render, the API service, **Logs**: look for `Could not send e-mail`. The line names the problem.
  Most often a value was pasted with a space, or the app is still in "Testing" (go back to step 5 of Part 1 and run the script again).
- **"invalid_grant" in the logs:** the key stopped working (password change on the Gmail account, or the access was removed).
  Run `python scripts/gmail_token.py` again and replace `GMAIL_REFRESH_TOKEN`.
- **Mail goes to spam:** normal for a new `gmail.com` sender. Ask testers to mark it "not spam". A domain of your own
  with proper DNS records fixes this for good.
- **Switch it off quickly:** set `EMAIL_VERIFICATION` back to `off`.

## On your own computer (optional)

`docker-compose.redesign.yml` starts **Mailpit**, a fake inbox: every e-mail the app sends appears at
http://localhost:8025 and nothing leaves your computer. Use it to try the flows without Gmail.
