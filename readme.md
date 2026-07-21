# Mun-ventory

A simple, 100% mobile-friendly PWA to manage **Stock Items**, **Menu Items** and **Product Mixes** (recipes), with a PIN lock, Excel reports and shareable recipe-card images.

## Features

- **PIN lock** — the whole app is locked behind a PIN (checked on the server, never sent to the browser). Wrong-PIN attempts are rate limited.
- **Stock Items** — name, category, purchase unit, consumption unit, notes. Individual CRUD + bulk upload from CSV/Excel (with downloadable template).
- **Menu Items** — name, category, consumption unit, notes. Individual CRUD + bulk upload.
- **Product Mix** — pick a menu item, add stock items with quantities. **Save Draft** (yellow) or **Confirm** (green). Filter by All / Not done / Drafts / Confirmed.
- **Bulk update** — select many stock/menu items at once to change category or unit, or delete; or **Export** to Excel, edit, and re-upload (rows with the `id` column update that exact item — you can even rename).
- **Categories** — create them once, pick them from dropdowns everywhere. Rename cascades to every item that used it; a category that's in use can be **archived** (not deleted).
- **Mix notes** — an optional note per product mix, shown on the recipe card and in the report.
- **Excel report** — every menu item with its ingredients, quantities, status and note. Download or share.
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

## Deploy on Render (Web Service)

This repo is ready for Render's **Web Service** feature — no Blueprint / `render.yaml` needed.

**1. Allow Render to reach MongoDB Atlas.**
In Atlas → **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`).
Render's outbound IPs are dynamic, so this is required for the app to connect.

**2. Create the service.**
- Push this repo to GitHub (already done).
- In Render: **New +** → **Web Service** → connect this GitHub repo.
- Render auto-detects Node. Confirm:
  - **Build Command:** `npm install`
  - **Start Command:** `npm start`
  - **Instance Type:** Free is fine to start.

**3. Add Environment Variables** (Render dashboard → your service → **Environment**):

| Key | Value |
|-----|-------|
| `MONGODB_URI` | your Atlas connection string |
| `APP_PIN` | `2026` (or your chosen PIN) |
| `SESSION_SECRET` | a long random string — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

> Do **not** set `PORT` — Render provides it automatically. Do **not** commit a real `.env`.

**4. Create Web Service / Deploy.** Render installs, starts `npm start`, and gives you an
`https://…onrender.com` URL. Open it on your phone → browser menu → **Add to Home screen /
Install app** to install the PWA. Every `git push` to `master` auto-deploys.

> **Free-tier note:** the service sleeps after ~15 min of inactivity and takes a few seconds
> to wake on the next visit. Your data is safe in MongoDB Atlas regardless.

## Deploy on Hostinger (VPS / Node hosting)

1. Upload the project (without `node_modules` and `.env`).
2. `npm install`, create `.env` with the variables above.
3. Run with `npm start` (or keep it alive with `pm2 start server.js --name munventory`).
4. Put it behind HTTPS (required for PWA install and image sharing).

## Notes

- `.env` is git-ignored — secrets never reach the repository.
- The MongoDB database used is `munventory` (created automatically on first write).
- Behind Render (or any reverse proxy) the default settings are correct. If you ever run `node server.js` exposed **directly** to the internet (no proxy in front), set `TRUST_PROXY=0` in `.env` so client IPs can't be spoofed.
- Wrong-PIN attempts are limited per device **and** globally (20 fails / 15 min), so the PIN can't be brute-forced.
