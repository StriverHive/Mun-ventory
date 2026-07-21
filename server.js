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

function catRegex(name) {
  return new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
}
function catCollection(type) {
  return type === 'menu' ? 'menuItems' : 'stockItems';
}
function categoryUsage(type, name) {
  return db.collection(catCollection(type)).countDocuments({ category: catRegex(name) });
}

// Rename a category and cascade the new name to every item that used it
app.put('/api/categories/:id', wrap(async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const name = str(req.body.name, 60);
  if (!name) return res.status(400).json({ error: 'Category name is required' });
  const cat = await db.collection('categories').findOne({ _id: new ObjectId(req.params.id) });
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const newKey = key(name);
  if (newKey !== cat.nameKey) {
    const dup = await db.collection('categories').findOne({ nameKey: newKey, type: cat.type, _id: { $ne: cat._id } });
    if (dup) return res.status(409).json({ error: 'A category with that name already exists' });
  }
  await db.collection('categories').updateOne({ _id: cat._id }, { $set: { name, nameKey: newKey } });
  const r = await db.collection(catCollection(cat.type)).updateMany({ category: catRegex(cat.name) }, { $set: { category: name } });
  res.json({ ok: true, updated: r.modifiedCount });
}));

// Archive / restore a category (archived categories are hidden from the dropdowns)
app.post('/api/categories/:id/archive', wrap(async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const archived = req.body.archived !== false;
  const r = await db.collection('categories').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { archived } });
  if (!r.matchedCount) return res.status(404).json({ error: 'Category not found' });
  res.json({ ok: true, archived });
}));

// Delete only when unused; otherwise the client should archive instead
app.delete('/api/categories/:id', wrap(async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const cat = await db.collection('categories').findOne({ _id: new ObjectId(req.params.id) });
  if (!cat) return res.json({ ok: true });
  const used = await categoryUsage(cat.type, cat.name);
  if (used > 0) return res.status(409).json({ error: `In use by ${used} item${used > 1 ? 's' : ''}. Archive it instead.` });
  await db.collection('categories').deleteOne({ _id: cat._id });
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

// Bulk upsert from an uploaded file. Two smart modes per row:
//  - Row has a valid `id` column  -> update THAT exact item (lets you rename it).
//  - Row has no id                -> upsert by name; only columns present in the
//    file are written, so a partial re-upload never wipes the other fields.
async function bulkUpsert(collection, items, optionalFields, cats) {
  let inserted = 0, updated = 0, skipped = 0;
  for (const row of items) {
    const src = row || {};
    const name = str(src.name);
    const idRaw = typeof src.id === 'string' ? src.id.trim() : '';

    const set = {};
    for (const [k, max] of Object.entries(optionalFields)) {
      if (typeof src[k] === 'string') set[k] = str(src[k], max);
    }

    // Update by id (rename allowed)
    if (idRaw && ObjectId.isValid(idRaw)) {
      if (name) { set.name = name; set.nameKey = key(name); }
      if (!Object.keys(set).length) { skipped++; continue; }
      try {
        const r = await db.collection(collection).updateOne({ _id: new ObjectId(idRaw) }, { $set: set });
        if (r.matchedCount) updated++; else skipped++;
      } catch (e) {
        if (e.code === 11000) { skipped++; } else throw e;
      }
      if (set.category) cats.add(set.category);
      continue;
    }

    // Upsert by name
    if (!name) { skipped++; continue; }
    set.name = name;
    set.nameKey = key(name);
    const insertDefaults = { createdAt: new Date() };
    for (const k of Object.keys(optionalFields)) if (!(k in set)) insertDefaults[k] = '';
    try {
      const r = await db.collection(collection).updateOne(
        { nameKey: set.nameKey },
        { $set: set, $setOnInsert: insertDefaults },
        { upsert: true }
      );
      if (r.upsertedCount) inserted++; else updated++;
    } catch (e) {
      if (e.code === 11000) { skipped++; continue; } else throw e;
    }
    if (set.category) cats.add(set.category);
  }
  return { inserted, updated, skipped };
}

// Set one field on many items at once (powers the in-app multi-select bulk edit).
async function bulkFieldUpdate(collection, catType, allowed, body) {
  const field = body.field;
  if (!Object.prototype.hasOwnProperty.call(allowed, field)) return { error: 'Invalid field' };
  const value = str(body.value, allowed[field]);
  const oids = (Array.isArray(body.ids) ? body.ids : []).filter((i) => ObjectId.isValid(i)).map((i) => new ObjectId(i));
  if (!oids.length) return { error: 'No items selected' };
  const r = await db.collection(collection).updateMany({ _id: { $in: oids } }, { $set: { [field]: value } });
  if (field === 'category' && value) await ensureCategory(value, catType);
  return { updated: r.modifiedCount };
}

function toObjectIds(list) {
  return (Array.isArray(list) ? list : []).filter((i) => ObjectId.isValid(i)).map((i) => new ObjectId(i));
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

app.post('/api/stock-items/bulk-update', wrap(async (req, res) => {
  const out = await bulkFieldUpdate('stockItems', 'stock',
    { category: 60, purchaseUnit: UNITS_MAX_LEN, consumptionUnit: UNITS_MAX_LEN }, req.body);
  if (out.error) return res.status(400).json(out);
  res.json(out);
}));

app.post('/api/stock-items/bulk-delete', wrap(async (req, res) => {
  const oids = toObjectIds(req.body.ids);
  if (!oids.length) return res.status(400).json({ error: 'No items selected' });
  const used = await db.collection('productMixes').distinct('items.stockItemId', { 'items.stockItemId': { $in: oids } });
  const usedSet = new Set(used.map(String));
  const deletable = oids.filter((id) => !usedSet.has(String(id)));
  let deleted = 0;
  if (deletable.length) {
    const r = await db.collection('stockItems').deleteMany({ _id: { $in: deletable } });
    deleted = r.deletedCount;
  }
  res.json({ deleted, skipped: oids.length - deletable.length });
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

app.post('/api/menu-items/bulk-update', wrap(async (req, res) => {
  const out = await bulkFieldUpdate('menuItems', 'menu',
    { category: 60, consumptionUnit: UNITS_MAX_LEN }, req.body);
  if (out.error) return res.status(400).json(out);
  res.json(out);
}));

app.post('/api/menu-items/bulk-delete', wrap(async (req, res) => {
  const oids = toObjectIds(req.body.ids);
  if (!oids.length) return res.status(400).json({ error: 'No items selected' });
  await db.collection('productMixes').deleteMany({ menuItemId: { $in: oids } });
  const r = await db.collection('menuItems').deleteMany({ _id: { $in: oids } });
  res.json({ deleted: r.deletedCount, skipped: 0 });
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
  res.json({ menuItemId: mix.menuItemId, status: mix.status, items: mix.items || [], notes: mix.notes || '' });
}));

// Save mix. Empty items list = clear the mix (back to "not done").
app.put('/api/product-mixes/:menuItemId', wrap(async (req, res) => {
  if (!ObjectId.isValid(req.params.menuItemId)) return res.status(400).json({ error: 'Invalid id' });
  const menuItemId = new ObjectId(req.params.menuItemId);
  const menuItem = await db.collection('menuItems').findOne({ _id: menuItemId });
  if (!menuItem) return res.status(404).json({ error: 'Menu item not found' });

  const status = req.body.status === 'confirmed' ? 'confirmed' : 'draft';
  const notes = str(req.body.notes, NOTES_MAX_LEN);
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
    { $set: { menuItemId, items, status, notes, updatedAt: new Date() } },
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
      notes: mix ? mix.notes || '' : '',
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
