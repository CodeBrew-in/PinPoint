# PinPoint frontend: glossary and screen list

Source: Stitch export ("Tactile Field & Editorial Cartography") checked against the UCS503 project proposal.
Rule: if a word or feature is not in this file or the proposal, it does not go in the UI.

## 1. Glossary (use these words everywhere)

| Stitch said | We say | Notes |
|---|---|---|
| Folio, Atlas, Binder, Plate | **Map** | Public Map or My Map (private) |
| Specimen, Pin, Exposure | **Place** | A location with photo, coordinates, description |
| Surveyor, Operator, Cartographer, Corps | **Member** (or just the username) | No ranks, no "Class III" |
| Curator / Lead Field Curator | **Owner** | Owner of a map |
| Field Contributors | **Contributors** | |
| Commission a field folio / Initialize new folio | **Create a map** | |
| Log pin / Stamp pin to atlas / Register specimen | **Add a place** / **Publish** | Stamp text stays "ADD A PLACE" |
| Field notes / Surveyor observation log | **Description** | |
| Field identifier / Security passcode | **Email** / **Password** | |
| Enter workspace / Register as surveyor | **Sign in** / **Create account** | |
| Dispatch queue / Curator queue / Pending approval | **Needs review** | Used for flagged places and reports |
| Verified entry / Provenance rating | **Verified** + **Last verified: date** | Verified = someone confirmed it still exists |
| Audit / Transit | (cut) | |
| Corps reputation 98.4% | (cut) | No reputation score in the proposal |
| My Atlas / Explore Archive | **My Maps** / **Explore** | |
| Workspace | **Map view** | |

Voice: short, plain, a little warm. Example: "Nobody has added a place here yet." not "Archive empty. Initiate first specimen."

Keep as decoration only: mono coordinates on cards and place pages (they are real data there), the rotating "ADD A PLACE" stamp, tilted photos, tape corners, gold verified seal.

## 2. Cut from the UI

- Pricing page and every plan or tier reference
- Documentation / Support desk (replace with a footer "Help" link if needed later)
- "Jump to screen / 14 plates" bar on every page (Stitch artifact)
- Coordinates and index numbers ("01", "02") in the navbar
- Reputation %, ranks, clearance levels, serial codes, station callsigns
- Fake system claims: "256-bit coordinate cipher", "immutable field log", "0.04ms synced", "operators on call"
- OpenStreetMap sign-in, GPX / zine / PDF / GeoJSON export, offline pass, API docs (not in the proposal; revisit after launch)
- ODbL licence tick box (decide licence separately before putting it in a sign-up form)
- Dashboard as a separate screen (merged into My Maps)

## 3. Screen list

Phase = build order from the proposal: **1 core**, **2 community**, **3 admin/AI**.

| # | Screen | Phase | Stitch source | What it must do |
|---|---|---|---|---|
| 1 | Landing | 1 | 1 | One-line pitch, 3-step "how it works", featured public maps, Sign in / Create account. Remove sample-data labels once real data exists. |
| 2 | Sign in | 1 | 6 | Email, password, forgot password, link to sign up. Drop the side dossier panel. |
| 3 | Create account | 1 | 7 | Username, email, password. Drop "mapping interest" and the credential-plate preview. |
| 4 | Explore | 1 | 2 | Search + category chips + sort (recent, most places). Map cards. Public maps only. |
| 5 | Map view (centerpiece) | 1 | 10 + 3 | Leaflet map, place list drawer, search/tag filter, selected place panel. Absorbs "map details": title, owner, public/private badge, contributors, Share button. |
| 6 | Place page | 1 → 2 | 11 | Photos, description, tags, coordinates, owner. Phase 2: "Still here" verify button, Add photo, Report, Last verified. |
| 7 | Create map | 1 | 12 | Title, description, Public or Private toggle. Remove bounds/datum/taxonomy sections. |
| 8 | Add a place | 1 → 2 | 13 | Photo upload with EXIF coordinates, map pin adjust, description, choose map. Public map: AI tag chips (pick from suggestions only). Private map: custom tags. |
| 8a | Possible duplicate step | 2 | new | Before publishing to a public map, list nearby or similar places. "Same place, add my photo" or "Different, continue". |
| 9 | My Maps | 1 | 9 + 8 | Tabs: Mine, Shared with me. Public/Private badge, place count. Replaces Dashboard. |
| 9a | Share map dialog | 2 | new | Invite by email, remove access. Private maps only. |
| 10 | Profile settings | 1 | 14 | Name, email, avatar, change password. Nothing else. |
| 11 | Review queue (mods/admin) | 3 | new | Reports, flagged places, duplicate conflicts, approve/remove. |
| 12 | Empty and error states | 1 | new | No maps, no places, no results, 404, upload failed. |

12 screens, of which 8 are phase 1.

## 4. Main flows to check the screens against

1. Sign in → My Maps → Create map (public or private) → Map view.
2. Map view → Add a place → upload photo → confirm coordinates → (public) check duplicates, pick AI tags → Publish.
3. Explore → open public map → open place → verify / add photo / report.
4. My Maps → private map → Share with another user.

## 5. Accessibility notes for the style

- Anton all-caps and Space Mono caps: headings and labels only. Body text and descriptions in DM Sans sentence case.
- Check ink `#15130F` on sage `#9DB08B` and gold `#C8A24C` for contrast before using them for small text.
- Keep a visible focus state (thicker border or deeper shadow) on every input and button.

## 6. Next step

Turn DESIGN.md into a Tailwind config, scaffold React + TypeScript + Tailwind + Leaflet, then build the shared components (Button, Stamp, FieldCard, PhotoPlate, Chip, Input, PlacePin) and screen 5 first.
