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

## Deploy on Hostinger

This is a **Node.js** app (Express server), so use one of Hostinger's Node-capable options.
First, in **MongoDB Atlas → Network Access**, add `0.0.0.0/0` (allow from anywhere) — or your
server's IP — so Hostinger can reach the database.

### Option A — hPanel “Setup Node.js App” (Premium / Business / Cloud plans)

1. **hPanel → Advanced → Node.js** (or **Website → Setup Node.js App**) → **Create application**:
   - **Node.js version:** 18 or newer (20 recommended)
   - **Application mode:** Production
   - **Application root:** e.g. `munventory`
   - **Application startup file:** `server.js`
   - **Application URL:** your domain or subdomain
2. **Put the code in the application root** — easiest is the built-in Git tool:
   *Repository URL* `https://github.com/StriverHive/Mun-ventory`, *Branch* `master`.
   (Or upload a ZIP of the project **without** `node_modules` and `.env`, then extract.)
3. In the app's **Environment variables** section add (do **not** add `PORT` — Hostinger sets it):
   - `MONGODB_URI` = your Atlas connection string
   - `APP_PIN` = `2026`
   - `SESSION_SECRET` = a long random string (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
4. Click **Run NPM Install**, then **Start / Restart** the app.
5. Open the Application URL over **https** → browser menu → **Add to Home Screen** to install the PWA.

### Option B — Hostinger VPS (full control)

```bash
# SSH into the VPS, then:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && . ~/.nvm/nvm.sh
nvm install 20
git clone https://github.com/StriverHive/Mun-ventory.git && cd Mun-ventory
npm install
cp .env.example .env        # then edit .env: MONGODB_URI, APP_PIN, SESSION_SECRET
npm install -g pm2
pm2 start server.js --name munventory && pm2 save && pm2 startup
```

Then put **nginx** in front as a reverse proxy to `http://localhost:3000` and add **HTTPS**
(Hostinger SSL or Let's Encrypt/Certbot). HTTPS is required for PWA install and image sharing.

## Notes

- `.env` is git-ignored — secrets never reach the repository. On hPanel Node apps you can set the
  values as Environment Variables instead of a `.env` file; both work.
- The MongoDB database used is `munventory` (created automatically on first write).
- Behind Hostinger/nginx (or any reverse proxy) the default settings are correct. Only if you run
  `node server.js` exposed **directly** to the internet (no proxy) set `TRUST_PROXY=0`.
- Wrong-PIN attempts are limited per device **and** globally (20 fails / 15 min).
- **Seeing an old/broken page after redeploying?** The PWA service worker may be serving a cached
  copy. Do a hard refresh (**Ctrl+Shift+R**), or in DevTools → Application → Storage →
  **Clear site data**. New visitors are unaffected; the app self-heals on the next load.
