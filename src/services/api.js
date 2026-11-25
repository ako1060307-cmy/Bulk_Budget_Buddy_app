import { DEFAULT_SETTINGS } from '../data/presets.js';
import { getTodayISO } from '../utils/analytics.js';
import {
  normalizeEmail,
  validateEntryInput,
  validateLoginInput,
  validateRegisterInput,
  validateSettingsInput,
} from '../utils/validation.js';

export const STORAGE_KEYS = {
  SESSION: 'bbb_session_v2',
  USERS: 'bbb_local_users_v2',
};

const API_BASE = '/api';
const REQUEST_TIMEOUT_MS = 1800;

async function fetchWithTimeout(url, options = {}, token = '') {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers,
    });
  } finally {
    clearTimeout(timer);
  }
}

function encodeLocalSecret(password) {
  // Deterministic lightweight hash for static-mode credential check in browser & Vitest
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < password.length; i += 1) {
    const ch = password.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16)}-${(h1 >>> 0).toString(16)}`;
}

function readLocalUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    // Ignore parse errors
  }
  return {};
}

function writeLocalUsers(usersMap) {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersMap));
  } catch {
    // Ignore quota errors
  }
}

export function getSavedSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.user && parsed.user.email) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveSession(session) {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  } catch {
    // Ignore quota errors
  }
}

export function clearSavedSession() {
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  } catch {
    // Ignore storage errors
  }
}

function upsertLocalUserRecord(user, password, settings, entries) {
  const users = readLocalUsers();
  const key = normalizeEmail(user.email);
  const existing = users[key];
  users[key] = {
    id: user.id || existing?.id || `local-${Date.now()}`,
    name: user.name,
    email: key,
    secret: password ? encodeLocalSecret(password) : existing?.secret || '',
    settings: settings || existing?.settings || { ...DEFAULT_SETTINGS, studentName: user.name },
    entries: Array.isArray(entries) ? entries : existing?.entries || [],
  };
  writeLocalUsers(users);
  return users[key];
}

export async function registerAccount(payload) {
  const validation = validateRegisterInput(payload);
  if (!validation.valid) {
    return { ok: false, error: validation.errors[0] };
  }

  const { name, email, password, monthlyBudget, calorieGoal, proteinGoal } = validation.sanitized;

  try {
    const res = await fetchWithTimeout(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ name, email, password, monthlyBudget, calorieGoal, proteinGoal }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || 'Could not create account.' };
    }
    const session = { token: data.token, user: data.user, syncMode: 'api' };
    saveSession(session);
    upsertLocalUserRecord(data.user, password, data.settings, []);
    return {
      ok: true,
      session,
      user: data.user,
      entries: [],
      settings: data.settings,
      syncMode: 'api',
    };
  } catch {
    // Static deployment / offline fallback
  }

  const users = readLocalUsers();
  if (users[email]) {
    return { ok: false, error: 'An account with this email already exists.' };
  }

  const user = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    email,
  };
  const settings = {
    ...DEFAULT_SETTINGS,
    studentName: name,
    monthlyBudget,
    calorieGoal,
    proteinGoal,
  };
  upsertLocalUserRecord(user, password, settings, []);
  const session = { token: `local-${user.id}`, user, syncMode: 'local' };
  saveSession(session);

  return {
    ok: true,
    session,
    user,
    entries: [],
    settings,
    syncMode: 'local',
  };
}

export async function loginAccount(payload) {
  const validation = validateLoginInput(payload);
  if (!validation.valid) {
    return { ok: false, error: validation.errors[0] };
  }

  const { email, password } = validation.sanitized;

  try {
    const res = await fetchWithTimeout(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || 'Invalid email or password.' };
    }
    const session = { token: data.token, user: data.user, syncMode: 'api' };
    saveSession(session);
    upsertLocalUserRecord(data.user, password, data.settings, data.entries);
    return {
      ok: true,
      session,
      user: data.user,
      entries: Array.isArray(data.entries) ? data.entries : [],
      settings: data.settings,
      syncMode: 'api',
    };
  } catch {
    // Static deployment / offline fallback
  }

  const users = readLocalUsers();
  const record = users[email];
  if (!record || record.secret !== encodeLocalSecret(password)) {
    return { ok: false, error: 'Invalid email or password.' };
  }

  const user = { id: record.id, name: record.name, email: record.email };
  const session = { token: `local-${record.id}`, user, syncMode: 'local' };
  saveSession(session);

  return {
    ok: true,
    session,
    user,
    entries: Array.isArray(record.entries) ? record.entries : [],
    settings: record.settings || { ...DEFAULT_SETTINGS, studentName: record.name },
    syncMode: 'local',
  };
}

export async function logoutAccount(session) {
  const token = session?.token || getSavedSession()?.token || '';
  clearSavedSession();
  if (token && !token.startsWith('local-')) {
    try {
      await fetchWithTimeout(`${API_BASE}/auth/logout`, { method: 'POST' }, token);
    } catch {
      // Ignore network errors on logout
    }
  }
}

export async function hydrateUserSession() {
  const saved = getSavedSession();
  if (!saved) {
    return { authenticated: false, user: null, entries: [], settings: DEFAULT_SETTINGS, syncMode: 'local' };
  }

  if (saved.token && !saved.token.startsWith('local-')) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/auth/me`, {}, saved.token);
      if (res.ok) {
        const data = await res.json();
        upsertLocalUserRecord(data.user, '', data.settings, data.entries);
        return {
          authenticated: true,
          token: saved.token,
          user: data.user,
          entries: Array.isArray(data.entries) ? data.entries : [],
          settings: data.settings,
          syncMode: 'api',
        };
      }
      if (res.status === 401) {
        clearSavedSession();
        return { authenticated: false, user: null, entries: [], settings: DEFAULT_SETTINGS, syncMode: 'api' };
      }
    } catch {
      // Fall back to cached local account record if backend unreachable
    }
  }

  const users = readLocalUsers();
  const record = users[normalizeEmail(saved.user.email)];
  if (!record) {
    clearSavedSession();
    return { authenticated: false, user: null, entries: [], settings: DEFAULT_SETTINGS, syncMode: 'local' };
  }

  return {
    authenticated: true,
    token: saved.token,
    user: { id: record.id, name: record.name, email: record.email },
    entries: Array.isArray(record.entries) ? record.entries : [],
    settings: record.settings || { ...DEFAULT_SETTINGS, studentName: record.name },
    syncMode: 'local',
  };
}

export async function createEntry(entryInput, currentEntries, session) {
  const validation = validateEntryInput(entryInput);
  if (!validation.valid) {
    return { ok: false, error: validation.errors[0], syncMode: session?.syncMode || 'local' };
  }

  const email = normalizeEmail(session?.user?.email || '');
  const token = session?.token || '';

  if (token && !token.startsWith('local-')) {
    try {
      const res = await fetchWithTimeout(
        `${API_BASE}/entries`,
        {
          method: 'POST',
          body: JSON.stringify(validation.sanitized),
        },
        token
      );
      if (res.ok) {
        const data = await res.json();
        const next = [data.entry, ...currentEntries].sort((a, b) =>
          `${b.date} ${b.time || ''}`.localeCompare(`${a.date} ${a.time || ''}`)
        );
        if (email) upsertLocalUserRecord(session.user, '', null, next);
        return { ok: true, entry: data.entry, entries: next, syncMode: 'api' };
      }
      if (res.status === 400) {
        const errData = await res.json();
        return { ok: false, error: errData.error || 'Invalid entry.', syncMode: 'api' };
      }
    } catch {
      // Fallback to localStorage
    }
  }

  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const localEntry = {
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: validation.sanitized.date || getTodayISO(),
    time,
    ...validation.sanitized,
  };
  const next = [localEntry, ...currentEntries].sort((a, b) =>
    `${b.date} ${b.time || ''}`.localeCompare(`${a.date} ${a.time || ''}`)
  );
  if (email) upsertLocalUserRecord(session.user, '', null, next);
  return { ok: true, entry: localEntry, entries: next, syncMode: 'local' };
}

export async function removeEntry(id, currentEntries, session) {
  const next = currentEntries.filter((e) => e.id !== id);
  const email = normalizeEmail(session?.user?.email || '');
  const token = session?.token || '';
  if (email) upsertLocalUserRecord(session.user, '', null, next);

  if (token && !token.startsWith('local-')) {
    try {
      const res = await fetchWithTimeout(
        `${API_BASE}/entries/${encodeURIComponent(id)}`,
        { method: 'DELETE' },
        token
      );
      if (res.ok || res.status === 404) {
        return { ok: true, entries: next, syncMode: 'api' };
      }
    } catch {
      // Static / offline fallback
    }
  }

  return { ok: true, entries: next, syncMode: 'local' };
}

export async function updateSettingsRemote(nextSettings, session) {
  const validation = validateSettingsInput(nextSettings);
  if (!validation.valid) {
    return { ok: false, error: validation.errors[0], syncMode: session?.syncMode || 'local' };
  }

  const email = normalizeEmail(session?.user?.email || '');
  const token = session?.token || '';
  if (email) upsertLocalUserRecord(session.user, '', validation.sanitized, null);

  if (token && !token.startsWith('local-')) {
    try {
      const res = await fetchWithTimeout(
        `${API_BASE}/settings`,
        {
          method: 'PUT',
          body: JSON.stringify(validation.sanitized),
        },
        token
      );
      if (res.ok) {
        const data = await res.json();
        if (email) upsertLocalUserRecord(session.user, '', data.settings, null);
        return { ok: true, settings: data.settings, syncMode: 'api' };
      }
    } catch {
      // Static / offline fallback
    }
  }

  return { ok: true, settings: validation.sanitized, syncMode: 'local' };
}

export async function resetAccountData(session) {
  const email = normalizeEmail(session?.user?.email || '');
  const token = session?.token || '';
  const defaultUserSettings = {
    ...DEFAULT_SETTINGS,
    studentName: session?.user?.name || DEFAULT_SETTINGS.studentName,
  };

  if (token && !token.startsWith('local-')) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/entries/reset`, { method: 'POST' }, token);
      if (res.ok) {
        const data = await res.json();
        if (email) upsertLocalUserRecord(session.user, '', data.settings, data.entries);
        return { entries: data.entries, settings: data.settings, syncMode: 'api' };
      }
    } catch {
      // Static / offline fallback
    }
  }

  if (email) upsertLocalUserRecord(session.user, '', defaultUserSettings, []);
  return { entries: [], settings: defaultUserSettings, syncMode: 'local' };
}
