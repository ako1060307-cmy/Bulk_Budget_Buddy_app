import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_SETTINGS } from '../src/data/presets.js';
import {
  validateEntryInput,
  validateLoginInput,
  validateRegisterInput,
  validateSettingsInput,
} from '../src/utils/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DB_PATH = path.join(__dirname, 'data', 'db.json');

function createEmptyStore() {
  return { users: [], sessions: {} };
}

function ensureStore(dbPath) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    const initialData = createEmptyStore();
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  try {
    const raw = fs.readFileSync(dbPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: parsed.sessions && typeof parsed.sessions === 'object' ? parsed.sessions : {},
    };
  } catch {
    const fallback = createEmptyStore();
    fs.writeFileSync(dbPath, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
}

function saveStore(dbPath, state) {
  fs.writeFileSync(dbPath, JSON.stringify(state, null, 2), 'utf-8');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
  if (typeof storedHash !== 'string' || !storedHash.includes(':')) return false;
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

function getTodayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function extractToken(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  if (typeof req.headers['x-auth-token'] === 'string') {
    return req.headers['x-auth-token'].trim();
  }
  return '';
}

function sanitizePublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

export function createApp({ dbPath = DEFAULT_DB_PATH } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '256kb' }));

  ensureStore(dbPath);

  const requireAuth = (req, res, next) => {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    const store = ensureStore(dbPath);
    const userId = store.sessions[token];
    const user = store.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    }
    req.auth = { token, userId: user.id };
    return next();
  };

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'bulk-budget-buddy-api', timestamp: new Date().toISOString() });
  });

  // Auth Routes
  app.post('/api/auth/register', (req, res) => {
    const validation = validateRegisterInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors[0], errors: validation.errors });
    }

    const { name, email, password, monthlyBudget, calorieGoal, proteinGoal } = validation.sanitized;
    const store = ensureStore(dbPath);

    if (store.users.some((u) => u.email === email)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const newUser = {
      id: `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      name,
      email,
      passwordHash: hashPassword(password),
      settings: {
        ...DEFAULT_SETTINGS,
        studentName: name,
        monthlyBudget,
        calorieGoal,
        proteinGoal,
      },
      entries: [], // Clean ₹0 start with 0 transactions
    };

    const token = crypto.randomBytes(24).toString('hex');
    store.users.push(newUser);
    store.sessions[token] = newUser.id;
    saveStore(dbPath, store);

    return res.status(201).json({
      token,
      user: sanitizePublicUser(newUser),
      entries: newUser.entries,
      settings: newUser.settings,
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const validation = validateLoginInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors[0], errors: validation.errors });
    }

    const { email, password } = validation.sanitized;
    const store = ensureStore(dbPath);
    const user = store.users.find((u) => u.email === email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    store.sessions[token] = user.id;
    saveStore(dbPath, store);

    const sortedEntries = [...(user.entries || [])].sort((a, b) =>
      `${b.date} ${b.time || ''}`.localeCompare(`${a.date} ${a.time || ''}`)
    );

    return res.json({
      token,
      user: sanitizePublicUser(user),
      entries: sortedEntries,
      settings: user.settings,
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = extractToken(req);
    if (token) {
      const store = ensureStore(dbPath);
      if (store.sessions[token]) {
        delete store.sessions[token];
        saveStore(dbPath, store);
      }
    }
    res.json({ ok: true });
  });

  app.get('/api/auth/me', requireAuth, (req, res) => {
    const store = ensureStore(dbPath);
    const user = store.users.find((u) => u.id === req.auth.userId);
    const sortedEntries = [...(user.entries || [])].sort((a, b) =>
      `${b.date} ${b.time || ''}`.localeCompare(`${a.date} ${a.time || ''}`)
    );
    res.json({
      user: sanitizePublicUser(user),
      entries: sortedEntries,
      settings: user.settings,
    });
  });

  // Scoped Entries & Settings Routes
  app.get('/api/entries', requireAuth, (req, res) => {
    const store = ensureStore(dbPath);
    const user = store.users.find((u) => u.id === req.auth.userId);
    const sorted = [...(user.entries || [])].sort((a, b) =>
      `${b.date} ${b.time || ''}`.localeCompare(`${a.date} ${a.time || ''}`)
    );
    res.json({ entries: sorted });
  });

  app.post('/api/entries', requireAuth, (req, res) => {
    const validation = validateEntryInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors[0], errors: validation.errors });
    }

    const store = ensureStore(dbPath);
    const user = store.users.find((u) => u.id === req.auth.userId);
    const now = new Date();
    const time =
      typeof req.body.time === 'string' && /^\d{2}:\d{2}$/.test(req.body.time)
        ? req.body.time
        : `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newEntry = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: validation.sanitized.date || getTodayISO(),
      time,
      item: validation.sanitized.item,
      amount: validation.sanitized.amount,
      category: validation.sanitized.category,
      calories: validation.sanitized.calories,
      protein: validation.sanitized.protein,
    };

    user.entries = [newEntry, ...(user.entries || [])].sort((a, b) =>
      `${b.date} ${b.time || ''}`.localeCompare(`${a.date} ${a.time || ''}`)
    );
    saveStore(dbPath, store);

    return res.status(201).json({ entry: newEntry });
  });

  app.delete('/api/entries/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const store = ensureStore(dbPath);
    const user = store.users.find((u) => u.id === req.auth.userId);
    const beforeCount = (user.entries || []).length;
    user.entries = (user.entries || []).filter((e) => e.id !== id);
    if (user.entries.length === beforeCount) {
      return res.status(404).json({ error: 'Entry not found.' });
    }
    saveStore(dbPath, store);
    return res.json({ deletedId: id });
  });

  app.post('/api/entries/reset', requireAuth, (req, res) => {
    const store = ensureStore(dbPath);
    const user = store.users.find((u) => u.id === req.auth.userId);
    user.entries = [];
    user.settings = {
      ...DEFAULT_SETTINGS,
      studentName: user.name,
    };
    saveStore(dbPath, store);
    res.json({ entries: user.entries, settings: user.settings });
  });

  app.get('/api/settings', requireAuth, (req, res) => {
    const store = ensureStore(dbPath);
    const user = store.users.find((u) => u.id === req.auth.userId);
    res.json({ settings: user.settings });
  });

  app.put('/api/settings', requireAuth, (req, res) => {
    const store = ensureStore(dbPath);
    const user = store.users.find((u) => u.id === req.auth.userId);
    const merged = { ...user.settings, ...req.body };
    const validation = validateSettingsInput(merged);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors[0], errors: validation.errors });
    }
    user.settings = validation.sanitized;
    saveStore(dbPath, store);
    return res.json({ settings: user.settings });
  });

  return app;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const PORT = Number(process.env.PORT) || 5000;
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Bulk Budget Buddy API running on http://localhost:${PORT}`);
  });
}
