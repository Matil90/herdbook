# HerdBook – sheep, goat and cattle records (prototype)

A phone-first web app (PWA) for livestock farmers in Algeria, focused on sheep, goats and cattle. No install or build step: plain HTML/CSS/JS.

Live at https://matil90.github.io/herdbook/ (GitHub Pages, branch `main`).

## Features
- **Farmer accounts**: several farmers can use one device; each one's records are kept separate.
- **Animals**: tag, name, species (sheep, goat, cattle), breed, sex, birth date (age is calculated), mother, status (Active / Sold / Deceased), notes, search and filters.
- **Health**: vaccinations, treatments, deworming, check-ups and so on, with medicine and cost. A record with a "Next due" date shows up as a reminder, with overdue and due-soon flags. Tapping **Done** logs the follow-up.
- **Age by teeth**: pick the picture that matches the lower front teeth to get an estimated age range. The estimate can be saved as an estimated birth date (shown with ≈).
- **Weight history** for each animal, with a trend chart.
- **Production**: milk per animal or for the whole herd, and feed (quantity and cost). Shows a 14-day chart and a week-over-week comparison.
- **Backup**: export or import all of a farmer's records as a JSON file.
- **Languages**: Arabic (right-to-left layout), English and French. Switch on the login screen or under Profile → Language. The first visit picks the phone's language. All translations live in `i18n.js`; to add a language, copy the `en` blocks there and translate them.
- Works offline after the first visit and can be added to the phone's home screen.

## Run it on this PC
```
powershell -ExecutionPolicy Bypass -File serve.ps1
```
Then open http://localhost:8080

## Publishing
Commit and push to `main`; GitHub Pages updates in 1–2 minutes. Bump `CACHE` in `sw.js` whenever app files change so installed phones pick up the new version.

## Current limits (demo)
- Data is saved in the browser on the device (localStorage). Nothing is shared between phones.
- There are no passwords; picking an account on the login screen opens it.

## Next steps
1. Accounts and online backup with Supabase, so records survive a lost phone and work on any device.
2. Buying guide: choosing a healthy animal, age for Eid, weight from a tape measure and price per kilo.
3. Buy/sell listings between breeders and buyers.
