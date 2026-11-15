# Security Audit Before Deployment

## Error / Problem

Before putting PinPoint on the internet, I ran a full security review: a dependency scan, an OWASP Top 10
audit, scanners for secrets, code, Docker files and CI workflows, a code review, and a final readiness review.
The result was **not ready for a public launch yet**.

The three most serious problems were:

- **Default signing key.** If `SECRET_KEY` was not set, the backend signed login tokens with a default key
  written in the source code. Because the repository is public, anyone could read that key and create a
  valid login for any account.
- **E-mail upper and lower case.** Accounts were looked up with the exact e-mail text, but roles and map
  sharing compared e-mails in lower case. Signing up with a different capitalisation of an address could
  therefore give someone that address's role or shared maps.
- **Guessable photo file names.** Photos were saved as `1.jpg`, `2.jpg`, and so on, so file names could be guessed.

No real secrets were found in the code or in the git history.

## Solution

- The backend now **refuses to start** without a `SECRET_KEY` of at least 32 characters, and Docker Compose
  requires it from `.env`. There is no default any more.
- E-mails are **converted to lower case** at signup and login, so every part of the app sees one account.
- New photos get **random file names**.
- Added tests for each fix. All 73 backend tests pass.

### Result

The three fixes are in a pull request. The remaining items (production build of the frontend, deployment
settings, backups, rate limits and more) are tracked in a private checklist and will be fixed before launch.

## Lesson

- A setting that has a "safe for development" default can silently reach production. Important secrets
  should have no default, so a missing value stops the app instead of weakening it.
- Compare e-mails in one consistent way everywhere.
- Run a security review before deployment, not after.
- Keep audit reports out of a public repository until the problems they describe are fixed.
