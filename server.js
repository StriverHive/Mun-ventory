require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const cookieParser = require('cookie-parser');
const { MongoClient, ObjectId } = require('mongodb');

const PORT = process.env.PORT || 3000;
const PIN = process.env.APP_PIN || '';
const SECRET = process.env.SESSION_SECRET || '';
const MONGODB_URI = process.env.MONGODB_URI || '';

if (!PIN || !SECRET || !MONGODB_URI) {
  console.error('Missing APP_PIN, SESSION_SECRET or MONGODB_URI in .env');
  process.exit(1);
}

const UNITS_MAX_LEN = 40;
const NAME_MAX_LEN = 120;
const NOTES_MAX_LEN = 1000;
const BULK_MAX_ROWS = 2000;
const DAY = 24 * 60 * 60 * 1000;
const SESSION_DAYS = 30;
const COOKIE = 'mv_session';

const app = express();
// Behind Render/nginx keep the default; set TRUST_PROXY=0 when Node is exposed directly
app.set('trust proxy', process.env.TRUST_PROXY === '0' ? false : 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

let db;

/* ---------- helpers ---------- */

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max || NAME_MAX_LEN) : '');
const key = (name) => name.trim().toLowerCase();

function sha256(v) {
  return crypto.createHash('sha256').update(String(v)).digest();
}

function pinMatches(pin) {
  return crypto.timingSafeEqual(sha256(pin), sha256(PIN));
}

function signSession() {
  const exp = Date.now() + SESSION_DAYS * DAY;
  const sig = crypto.createHmac('sha256', SECRET).update(String(exp)).digest('hex');
  return exp + '.' + sig;
}

function verifySession(token) {
  if (!token || typeof token !== 'string') return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  if (!/^[0-9a-f]{64}$/.test(sig)) return false; // guarantees equal byte length below
  const expect = crypto.createHmac('sha256', SECRET).update(String(exp)).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect));
}

async function ensureCategory(name, type) {
  const clean = str(name, 60);
  if (!clean) return;
  await db.collection('categories').updateOne(
    { nameKey: key(clean), type },
    { $setOnInsert: { name: clean, nameKey: key(clean), type, createdAt: new Date() } },
    { upsert: true }
  );
}

const wrap = (fn) => (req, res) => fn(req, res).catch((err) => {
  if (err && err.code === 11000) return res.status(409).json({ error: 'An item with this name already exists' });
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

/* ---------- login (rate limited) ---------- */

const attempts = new Map(); // ip -> { count, lockedUntil, lastSeen }
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

// Global cap so rotating spoofed IPs/X-Forwarded-For can never buy extra guesses
const GLOBAL_MAX_FAILS = 20;
let globalFails = 0;
let globalWindowStart = Date.now();

function globalLocked() {
  if (Date.now() - globalWindowStart > LOCK_MS) {
    globalFails = 0;
    globalWindowStart = Date.now();
  }
  return globalFails >= GLOBAL_MAX_FAILS;
}

// Prune stale per-IP entries so the map stays bounded
setInterval(() => {
  const now = Date.now();
  for (const [ip, a] of attempts) {
    if (a.lockedUntil < now && now - (a.lastSeen || 0) > LOCK_MS) attempts.delete(ip);
  }
}, 10 * 60 * 1000).unref();

app.post('/api/login', (req, res) => {
  const ip = req.ip || 'unknown';
  const a = attempts.get(ip) || { count: 0, lockedUntil: 0, lastSeen: 0 };
  if (globalLocked() || Date.now() < a.lockedUntil) {
    return res.status(429).json({ error: 'Too many wrong attempts. Try again in a few minutes.' });
  }
  const pin = typeof req.body.pin === 'string' ? req.body.pin : '';
  if (pin && pinMatches(pin)) {
    attempts.delete(ip);
    res.cookie(COOKIE, signSession(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.secure,
      maxAge: SESSION_DAYS * DAY,
    });
    return res.json({ ok: true });
  }
  globalFails += 1;
  a.count += 1;
  a.lastSeen = Date.now();
  if (a.count >= MAX_ATTEMPTS) {
    a.lockedUntil = Date.now() + LOCK_MS;
    a.count = 0;
  }
  attempts.set(ip, a);
  res.status(401).json({ error: 'Wrong PIN' });
});

/* ---------- auth wall for everything else under /api ---------- */

app.use('/api', (req, res, next) => {
  if (verifySession(req.cookies[COOKIE])) return next();
  res.status(401).json({ error: 'Unauthorized' });
});

app.get('/api/me', (req, res) => res.json({ ok: true }));

app.post('/api/logout', (req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

/* ---------- categories ---------- */

app.get('/api/categories', wrap(async (req, res) => {
  const type = req.query.type === 'menu' ? 'menu' : 'stock';
  const cats = await db.collection('categories').find({ type }).sort({ name: 1 }).toArray();
  res.json(cats);
}));

app.post('/api/categories', wrap(async (req, res) => {
  const name = str(req.body.name, 60);
  const type = req.body.type === 'menu' ? 'menu' : 'stock';
  if (!name) return res.status(400).json({ error: 'Category name is required' });
  await ensureCategory(name, type);
  const cat = await db.collection('categories').findOne({ nameKey: key(name), type });
  res.json(cat);
}));

app.delete('/api/categories/:id', wrap(async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  await db.collection('categories').deleteOne({ _id: new ObjectId(req.params.id) });
  res.json({ ok: true });
}));

/* ---------- stock items ---------- */

function stockDoc(body) {
  return {
    name: str(body.name),
    category: str(body.category, 60),
    purchaseUnit: str(body.purchaseUnit, UNITS_MAX_LEN),
    consumptionUnit: str(body.consumptionUnit, UNITS_MAX_LEN),
    notes: str(body.notes, NOTES_MAX_LEN),
  };
}

app.get('/api/stock-items', wrap(async (req, res) => {
  const items = await db.collection('stockItems').find({}).sort({ name: 1 }).collation({ locale: 'en' }).toArray();
  res.json(items);
}));

app.post('/api/stock-items', wrap(async (req, res) => {
  const doc = stockDoc(req.body);
  if (!doc.name) return res.status(400).json({ error: 'Name is required' });
  doc.nameKey = key(doc.name);
  doc.createdAt = new Date();
  const r = await db.collection('stockItems').insertOne(doc);
  if (doc.category) await ensureCategory(doc.category, 'stock');
  res.json({ ...doc, _id: r.insertedId });
}));

app.put('/api/stock-items/:id', wrap(async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const doc = stockDoc(req.body);
  if (!doc.name) return res.status(400).json({ error: 'Name is required' });
  doc.nameKey = key(doc.name);
  const r = await db.collection('stockItems').updateOne({ _id: new ObjectId(req.params.id) }, { $set: doc });
  if (!r.matchedCount) return res.status(404).json({ error: 'Not found' });
  if (doc.category) await ensureCategory(doc.category, 'stock');
  res.json({ ok: true });
}));

app.delete('/api/stock-items/:id', wrap(async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const id = new ObjectId(req.params.id);
  const used = await db.collection('productMixes').countDocuments({ 'items.stockItemId': id });
  if (used > 0) return res.status(409).json({ error: `Used in ${used} product mix${used > 1 ? 'es' : ''}. Remove it from those first.` });
  await db.collection('stockItems').deleteOne({ _id: id });
  res.json({ ok: true });
}));

// Upsert by name. Only columns present in the upload are written, so a partial
// re-upload (e.g. Name + Category only) never wipes the other fields.
async function bulkUpsert(collection, items, optionalFields, cats) {
  let inserted = 0, updated = 0, skipped = 0;
  for (const row of items) {
    const src = row || {};
    const name = str(src.name);
    if (!name) { skipped++; continue; }
    const set = { name, nameKey: key(name) };
    const insertDefaults = { createdAt: new Date() };
    for (const [k, max] of Object.entries(optionalFields)) {
      if (typeof src[k] === 'string') set[k] = str(src[k], max);
      else insertDefaults[k] = '';
    }
    const r = await db.collection(collection).updateOne(
      { nameKey: set.nameKey },
      { $set: set, $setOnInsert: insertDefaults },
      { upsert: true }
    );
    if (r.upsertedCount) inserted++; else updated++;
    if (set.category) cats.add(set.category);
  }
  return { inserted, updated, skipped };
}

app.post('/api/stock-items/bulk', wrap(async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (items.length > BULK_MAX_ROWS) {
    return res.status(400).json({ error: `Too many rows (${items.length}). Maximum is ${BULK_MAX_ROWS} per upload — split the file.` });
  }
  const cats = new Set();
  const result = await bulkUpsert('stockItems', items, {
    category: 60, purchaseUnit: UNITS_MAX_LEN, consumptionUnit: UNITS_MAX_LEN, notes: NOTES_MAX_LEN,
  }, cats);
  for (const c of cats) await ensureCategory(c, 'stock');
  res.json(result);
}));

/* ---------- menu items ---------- */

function menuDoc(body) {
  return {
    name: str(body.name),
    category: str(body.category, 60),
    consumptionUnit: str(body.consumptionUnit, UNITS_MAX_LEN),
    notes: str(body.notes, NOTES_MAX_LEN),
  };
}

app.get('/api/menu-items', wrap(async (req, res) => {
  const items = await db.collection('menuItems').find({}).sort({ name: 1 }).collation({ locale: 'en' }).toArray();
  res.json(items);
}));

app.post('/api/menu-items', wrap(async (req, res) => {
  const doc = menuDoc(req.body);
  if (!doc.name) return res.status(400).json({ error: 'Name is required' });
  doc.nameKey = key(doc.name);
  doc.createdAt = new Date();
  const r = await db.collection('menuItems').insertOne(doc);
  if (doc.category) await ensureCategory(doc.category, 'menu');
  res.json({ ...doc, _id: r.insertedId });
}));

app.put('/api/menu-items/:id', wrap(async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const doc = menuDoc(req.body);
  if (!doc.name) return res.status(400).json({ error: 'Name is required' });
  doc.nameKey = key(doc.name);
  const r = await db.collection('menuItems').updateOne({ _id: new ObjectId(req.params.id) }, { $set: doc });
  if (!r.matchedCount) return res.status(404).json({ error: 'Not found' });
  if (doc.category) await ensureCategory(doc.category, 'menu');
  res.json({ ok: true });
}));

app.delete('/api/menu-items/:id', wrap(async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const id = new ObjectId(req.params.id);
  await db.collection('productMixes').deleteOne({ menuItemId: id });
  await db.collection('menuItems').deleteOne({ _id: id });
  res.json({ ok: true });
}));

app.post('/api/menu-items/bulk', wrap(async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (items.length > BULK_MAX_ROWS) {
    return res.status(400).json({ error: `Too many rows (${items.length}). Maximum is ${BULK_MAX_ROWS} per upload — split the file.` });
  }
  const cats = new Set();
  const result = await bulkUpsert('menuItems', items, {
    category: 60, consumptionUnit: UNITS_MAX_LEN, notes: NOTES_MAX_LEN,
  }, cats);
  for (const c of cats) await ensureCategory(c, 'menu');
  res.json(result);
}));

/* ---------- product mixes ---------- */

// All mixes (light) - used for status badges on the menu list
app.get('/api/product-mixes', wrap(async (req, res) => {
  const mixes = await db.collection('productMixes')
    .find({}, { projection: { menuItemId: 1, status: 1, items: 1 } }).toArray();
  res.json(mixes.map((m) => ({
    menuItemId: m.menuItemId,
    status: m.status,
    itemCount: (m.items || []).length,
  })));
}));

// One mix, with stock item details populated
app.get('/api/product-mixes/:menuItemId', wrap(async (req, res) => {
  if (!ObjectId.isValid(req.params.menuItemId)) return res.status(400).json({ error: 'Invalid id' });
  const mix = await db.collection('productMixes').findOne({ menuItemId: new ObjectId(req.params.menuItemId) });
  if (!mix) return res.json(null);
  res.json({ menuItemId: mix.menuItemId, status: mix.status, items: mix.items || [] });
}));

// Save mix. Empty items list = clear the mix (back to "not done").
app.put('/api/product-mixes/:menuItemId', wrap(async (req, res) => {
  if (!ObjectId.isValid(req.params.menuItemId)) return res.status(400).json({ error: 'Invalid id' });
  const menuItemId = new ObjectId(req.params.menuItemId);
  const menuItem = await db.collection('menuItems').findOne({ _id: menuItemId });
  if (!menuItem) return res.status(404).json({ error: 'Menu item not found' });

  const status = req.body.status === 'confirmed' ? 'confirmed' : 'draft';
  const rawItems = Array.isArray(req.body.items) ? req.body.items : [];

  if (rawItems.length === 0) {
    await db.collection('productMixes').deleteOne({ menuItemId });
    return res.json({ cleared: true });
  }

  const seen = new Set();
  const items = [];
  for (const it of rawItems) {
    if (!it || !ObjectId.isValid(it.stockItemId)) return res.status(400).json({ error: 'Invalid stock item in mix' });
    const qty = Number(it.qty);
    if (!Number.isFinite(qty) || qty <= 0) return res.status(400).json({ error: 'Every quantity must be a number greater than 0' });
    if (seen.has(String(it.stockItemId))) return res.status(400).json({ error: 'A stock item appears twice in the mix' });
    seen.add(String(it.stockItemId));
    items.push({ stockItemId: new ObjectId(it.stockItemId), qty });
  }
  const count = await db.collection('stockItems').countDocuments({ _id: { $in: items.map((i) => i.stockItemId) } });
  if (count !== items.length) return res.status(400).json({ error: 'One of the stock items no longer exists. Refresh and try again.' });

  await db.collection('productMixes').updateOne(
    { menuItemId },
    { $set: { menuItemId, items, status, updatedAt: new Date() } },
    { upsert: true }
  );
  res.json({ ok: true, status });
}));

/* ---------- report data ---------- */

app.get('/api/report', wrap(async (req, res) => {
  const [menu, mixes, stock] = await Promise.all([
    db.collection('menuItems').find({}).sort({ name: 1 }).collation({ locale: 'en' }).toArray(),
    db.collection('productMixes').find({}).toArray(),
    db.collection('stockItems').find({}).toArray(),
  ]);
  const stockMap = new Map(stock.map((s) => [String(s._id), s]));
  const mixMap = new Map(mixes.map((m) => [String(m.menuItemId), m]));
  const rows = menu.map((m) => {
    const mix = mixMap.get(String(m._id));
    return {
      name: m.name,
      category: m.category || '',
      status: mix ? mix.status : 'not_done',
      items: (mix ? mix.items || [] : []).map((it) => {
        const s = stockMap.get(String(it.stockItemId));
        return {
          stockName: s ? s.name : '(deleted item)',
          qty: it.qty,
          unit: s ? s.consumptionUnit : '',
        };
      }),
    };
  });
  res.json(rows);
}));

/* ---------- static frontend ---------- */

app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders(res, filePath) {
    if (filePath.endsWith('index.html') || filePath.endsWith('sw.js')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else if (/[\\/]vendor[\\/]|[\\/]icons[\\/]/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800');
    }
  },
}));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ---------- start ---------- */

async function start() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db('munventory');
  await Promise.all([
    db.collection('stockItems').createIndex({ nameKey: 1 }, { unique: true }),
    db.collection('menuItems').createIndex({ nameKey: 1 }, { unique: true }),
    db.collection('categories').createIndex({ nameKey: 1, type: 1 }, { unique: true }),
    db.collection('productMixes').createIndex({ menuItemId: 1 }, { unique: true }),
  ]);
  app.listen(PORT, () => console.log(`Mun-ventory running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});
