# Mun-ventory

A simple, 100% mobile-friendly PWA to manage **Stock Items**, **Menu Items** and **Product Mixes** (recipes), with a PIN lock, Excel reports and shareable recipe-card images.

## Features

- **PIN lock** — the whole app is locked behind a PIN (checked on the server, never sent to the browser). Wrong-PIN attempts are rate limited.
- **Stock Items** — name, category, purchase unit, consumption unit, notes. Individual CRUD + bulk upload from CSV/Excel (with downloadable template).
- **Menu Items** — name, category, consumption unit, notes. Individual CRUD + bulk upload.
- **Product Mix** — pick a menu item, add stock items with quantities. **Save Draft** (yellow) or **Confirm** (green). Filter by All / Not done / Drafts / Confirmed.
- **Categories** — create them once, pick them from dropdowns everywhere.
- **Excel report** — every menu item with its ingredients, quantities and status. Download or share.
- **Recipe card image** — share or save any saved mix as a PNG image.
- **PWA** — installable on Android/iPhone straight from the browser, white & pink theme.

## Run locally

```bash
npm install
# create .env (copy .env.example) and fill in:
#   MONGODB_URI, APP_PIN, SESSION_SECRET, PORT
npm start
# open http://localhost:3000
```

## Deploy on Render

1. Push this repo to GitHub.
2. In Render: **New → Web Service**, connect the repo.
3. Build command: `npm install` — Start command: `npm start`.
4. Add environment variables: `MONGODB_URI`, `APP_PIN`, `SESSION_SECRET` (any long random string).
5. Deploy. Open the URL on your phone → browser menu → **Add to Home screen / Install app**.

## Deploy on Hostinger (VPS / Node hosting)

1. Upload the project (without `node_modules` and `.env`).
2. `npm install`, create `.env` with the four variables above.
3. Run with `npm start` (or keep it alive with `pm2 start server.js --name munventory`).
4. Put it behind HTTPS (required for PWA install and camera-free sharing).

## Notes

- `.env` is git-ignored — secrets never reach the repository.
- The MongoDB database used is `munventory` (created automatically on first write).
- Behind Render (or any reverse proxy) the default settings are correct. If you ever run `node server.js` exposed **directly** to the internet (no proxy in front), set `TRUST_PROXY=0` in `.env` so client IPs can't be spoofed.
- Wrong-PIN attempts are limited per device **and** globally (20 fails / 15 min), so the PIN can't be brute-forced.
