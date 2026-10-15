# PRD – Officina Lavori Web (job-sheet-hub-2 web version)

## Original problem statement
"Crea una versione web dell'app job-sheet-hub-2 con le stesse funzionalità — caricamento file Excel e creazione automatica di schede. Usa lo stesso database dell'app mobile per sincronizzare i dati tra le due app."

## Architecture
- React SPA (frontend only) calling the MOBILE app backend directly: REACT_APP_MOBILE_API_URL=https://job-sheet-hub-2.preview.emergentagent.com (/api). Same server = same MongoDB, so the two apps stay in sync in real time.
- The mobile DB (mongodb://localhost:27017) runs only inside the mobile app's server and can't be reached from outside, so sync goes through the API.
- Local FastAPI template backend is unused.
- Auth: same JWT login as mobile (/auth/login, token in localStorage).

## Personas
- Admin: uploads Excel files, manages operators, logo and the scrap minimum length
- Operator: works steps (timer, sessions, photos), cutting, scraps

## Implemented (2026-10-15)
- Login/logout; dashboard (stats, steps in progress, customer folders, search)
- Excel upload (drag & drop) → sheets created automatically by the mobile backend
- Customer folder, sheet detail (phases with required toggle, info/tolerances edit, delete, QR labels PDF, customer report PDF)
- Phase steps (filters, parameters), step page (timer start/pause/stop/reopen, operators, manual sessions, photos, fields, notes)
- Bar cutting (bar mode, kerf, scraps, patterns, bar toggles)
- Scraps warehouse (filters, add/delete, labels, min length) + scrap detail
- Operators management + company logo
- QR scan (camera through BarcodeDetector where available, plus manual code)

## Backlog
- P1: point REACT_APP_MOBILE_API_URL at the mobile app's deployed URL once it is published (the preview URL can go to sleep)
- P2: CSV/Excel export of hours; dark mode
