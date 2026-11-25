import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../../server/index.js';
import {
  createEntry,
  hydrateUserSession,
  loginAccount,
  logoutAccount,
  registerAccount,
} from '../services/api.js';

describe('Auth Gateway, Express REST API & Per-Account Isolation', () => {
  let server;
  let baseUrl;
  let tempDbPath;

  beforeAll(async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bbb-auth-test-'));
    tempDbPath = path.join(tmpDir, 'db.json');
    const app = createApp({ dbPath: tempDbPath });
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (tempDbPath && fs.existsSync(path.dirname(tempDbPath))) {
      fs.rmSync(path.dirname(tempDbPath), { recursive: true, force: true });
    }
  });

  it('requires authentication on protected /api/entries and /api/settings routes', async () => {
    const health = await fetch(`${baseUrl}/api/health`).then((r) => r.json());
    expect(health.ok).toBe(true);

    const unauthEntries = await fetch(`${baseUrl}/api/entries`);
    expect(unauthEntries.status).toBe(401);

    const unauthSettings = await fetch(`${baseUrl}/api/settings`);
    expect(unauthSettings.status).toBe(401);
  });

  it('registers a new account starting cleanly at ₹0 with 0 transactions and enforces duplicate checks', async () => {
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ayush Kumar Ojha',
        email: 'ayush@csd.edu',
        password: 'password123',
        monthlyBudget: 8000,
        calorieGoal: 3300,
        proteinGoal: 140,
      }),
    });
    expect(regRes.status).toBe(201);
    const data = await regRes.json();
    expect(data.entries).toEqual([]);
    expect(data.settings.monthlyBudget).toBe(8000);
    expect(data.user.email).toBe('ayush@csd.edu');
    expect(data.token).toBeTruthy();

    // Duplicate email rejected with 409
    const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ayush Duplicate',
        email: 'ayush@csd.edu',
        password: 'password123',
      }),
    });
    expect(dupRes.status).toBe(409);
  });

  it('isolates transactions & settings per user account across login sessions', async () => {
    // Login as User A
    const loginA = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ayush@csd.edu', password: 'password123' }),
    }).then((r) => r.json());

    // User A logs Paneer ₹90
    const postA = await fetch(`${baseUrl}/api/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginA.token}`,
      },
      body: JSON.stringify({
        item: 'Paneer (200g)',
        amount: 90,
        category: 'Clean Bulk Groceries',
        calories: 530,
        protein: 36,
      }),
    });
    expect(postA.status).toBe(201);
    const createdA = await postA.json();

    // Register User B with custom budget ₹12,000
    const regB = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rohan Sharma',
        email: 'rohan@csd.edu',
        password: 'rohanpass99',
        monthlyBudget: 12000,
        calorieGoal: 3000,
        proteinGoal: 120,
      }),
    }).then((r) => r.json());

    // User B must start at ₹0 with 0 entries and cannot see or delete User A's entry
    const entriesB = await fetch(`${baseUrl}/api/entries`, {
      headers: { Authorization: `Bearer ${regB.token}` },
    }).then((r) => r.json());
    expect(entriesB.entries).toEqual([]);
    expect(regB.settings.monthlyBudget).toBe(12000);

    const crossDel = await fetch(`${baseUrl}/api/entries/${createdA.entry.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${regB.token}` },
    });
    expect(crossDel.status).toBe(404);

    // Wrong password returns 401
    const badLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rohan@csd.edu', password: 'wrongpassword' }),
    });
    expect(badLogin.status).toBe(401);
  });

  it('rejects negative prices and XSS payloads on POST /api/entries', async () => {
    const loginA = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ayush@csd.edu', password: 'password123' }),
    }).then((r) => r.json());

    const badPrice = await fetch(`${baseUrl}/api/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginA.token}`,
      },
      body: JSON.stringify({
        item: 'Paneer',
        amount: -90,
        category: 'Clean Bulk Groceries',
      }),
    });
    expect(badPrice.status).toBe(400);

    const badXss = await fetch(`${baseUrl}/api/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginA.token}`,
      },
      body: JSON.stringify({
        item: '<script>alert(1)</script>',
        amount: 90,
        category: 'Clean Bulk Groceries',
      }),
    });
    expect(badXss.status).toBe(400);
  });

  it('supports full static localStorage auth & per-account isolation when offline', async () => {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    };
    const origFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error('Network offline');
    };

    try {
      // Fresh unauthenticated load
      const initial = await hydrateUserSession();
      expect(initial.authenticated).toBe(false);
      expect(initial.entries).toEqual([]);

      // Register User 1 in static mode
      const reg1 = await registerAccount({
        name: 'Ayush Ojha',
        email: 'ayush@static.edu',
        password: 'staticpass1',
        monthlyBudget: 8000,
        calorieGoal: 3300,
        proteinGoal: 140,
      });
      expect(reg1.ok).toBe(true);
      expect(reg1.entries).toEqual([]);
      expect(reg1.syncMode).toBe('local');

      const added = await createEntry(
        { item: 'Sattu 100g', amount: 22, category: 'Clean Bulk Groceries', calories: 410, protein: 20 },
        reg1.entries,
        reg1.session
      );
      expect(added.ok).toBe(true);
      expect(added.entries.length).toBe(1);

      // Logout and register User 2
      await logoutAccount(reg1.session);
      const reg2 = await registerAccount({
        name: 'Karan Verma',
        email: 'karan@static.edu',
        password: 'staticpass2',
        monthlyBudget: 9500,
        calorieGoal: 3100,
        proteinGoal: 130,
      });
      expect(reg2.ok).toBe(true);
      expect(reg2.entries).toEqual([]);
      expect(reg2.settings.monthlyBudget).toBe(9500);

      // Logout and sign back in as User 1 -> User 1's entry persists cleanly
      await logoutAccount(reg2.session);
      const back1 = await loginAccount({ email: 'ayush@static.edu', password: 'staticpass1' });
      expect(back1.ok).toBe(true);
      expect(back1.entries.length).toBe(1);
      expect(back1.entries[0].item).toBe('Sattu 100g');
    } finally {
      globalThis.fetch = origFetch;
      delete globalThis.localStorage;
    }
  });
});
