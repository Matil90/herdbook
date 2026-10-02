# HerdBook – livestock records app (prototype)

A phone-first web app (PWA) for livestock farmers. No install or build step: plain HTML/CSS/JS.

## Features
- **Farmer accounts**: several farmers can use one device; each one's records are kept separate.
- **Animals**: tag, name, species, breed, sex, birth date (age is calculated), mother, status (Active / Sold / Deceased), notes, search and filters.
- **Health**: vaccinations, treatments, deworming, check-ups and so on, with medicine and cost. A record with a "Next due" date shows up as a reminder, with overdue and due-soon flags. Tapping **Done** logs the follow-up.
- **Age by teeth**: for cattle, sheep, goats and camels, pick the picture that matches the lower front teeth to get an estimated age range. The estimate can be saved as an estimated birth date (shown with ≈).
- **Weight history** for each animal, with a trend chart.
- **Production**: milk per animal or for the whole herd, eggs, and feed (quantity and cost). Shows a 14-day chart and a week-over-week comparison.
- **Backup**: export or import all of a farmer's records as a JSON file.
- **Languages**: Arabic (right-to-left layout), English and French. Switch on the login screen or under Profile → Language. The first visit picks the phone's language. All translations live in `i18n.js`; to add a language, copy the `en` blocks there and translate them.
- Works offline after the first visit and can be added to the phone's home screen.

## Run it on this PC
```
powershell -ExecutionPolicy Bypass -File serve.ps1
```
Then open http://localhost:8080

## Current limits (demo)
- Data is saved in the browser on the device (localStorage). Nothing is shared between phones.
- There are no passwords; picking an account on the login screen opens it.

## Next steps
1. Host it online (Netlify, GitHub Pages or Cloudflare Pages are free) so phones can open it and install it.
2. Add a real backend (e.g. Supabase) for logins and a shared database so farmers can use it on any device.
3. Wrap it as a native Android/iOS app (Capacitor or Expo), add push reminders for due vaccinations, and offer an Arabic/RTL language option.
