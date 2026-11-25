import { describe, it, expect } from 'vitest';
import {
  hasXSSPattern,
  sanitizeText,
  validateEntryInput,
  validateLoginInput,
  validateRegisterInput,
  validateSettingsInput,
} from '../utils/validation.js';

describe('Strict Input Validation, Auth Guardrails & XSS Defense', () => {
  it('accepts valid Clean Bulk entry and sanitizes whitespace', () => {
    const res = validateEntryInput({
      item: '  Sattu   (100g) + Sugar  ',
      amount: 22,
      category: 'Clean Bulk Groceries',
      calories: 410,
      protein: 20,
      date: '2026-11-25',
    });
    expect(res.valid).toBe(true);
    expect(res.sanitized.item).toBe('Sattu (100g) + Sugar');
    expect(res.sanitized.amount).toBe(22);
  });

  it('blocks negative, zero, NaN, and Infinity prices', () => {
    for (const badAmount of [-50, 0, NaN, Infinity, 'abc']) {
      const res = validateEntryInput({
        item: 'Paneer',
        amount: badAmount,
        category: 'Clean Bulk Groceries',
      });
      expect(res.valid).toBe(false);
    }
  });

  it('blocks negative macros and invalid categories', () => {
    const negCal = validateEntryInput({
      item: 'Paneer',
      amount: 90,
      category: 'Clean Bulk Groceries',
      calories: -100,
      protein: 20,
    });
    expect(negCal.valid).toBe(false);

    const badCat = validateEntryInput({
      item: 'Paneer',
      amount: 90,
      category: 'UnknownCategory',
    });
    expect(badCat.valid).toBe(false);
  });

  it('detects and rejects XSS strings', () => {
    const payloads = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert(1)>',
      'javascript:alert(document.cookie)',
      '<svg onload=fetch("http://evil")>',
    ];
    for (const payload of payloads) {
      expect(hasXSSPattern(payload)).toBe(true);
      const res = validateEntryInput({
        item: payload,
        amount: 50,
        category: 'Academic & Misc',
      });
      expect(res.valid).toBe(false);
    }
    expect(sanitizeText('<b>Paneer</b>')).toBe('bPaneer/b');
  });

  it('validates settings thresholds safely', () => {
    const ok = validateSettingsInput({
      monthlyBudget: 8000,
      calorieGoal: 3300,
      proteinGoal: 140,
    });
    expect(ok.valid).toBe(true);

    const bad = validateSettingsInput({
      monthlyBudget: 0,
      calorieGoal: -200,
      proteinGoal: 2,
    });
    expect(bad.valid).toBe(false);
    expect(bad.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('validates registration and login payloads strictly', () => {
    const validReg = validateRegisterInput({
      name: 'Ayush Kumar Ojha',
      email: 'Ayush@College.EDU',
      password: 'secret123',
      monthlyBudget: 8000,
      calorieGoal: 3300,
      proteinGoal: 140,
    });
    expect(validReg.valid).toBe(true);
    expect(validReg.sanitized.email).toBe('ayush@college.edu');

    const badReg = validateRegisterInput({
      name: '<script>alert(1)</script>',
      email: 'not-an-email',
      password: '123',
      monthlyBudget: -500,
    });
    expect(badReg.valid).toBe(false);
    expect(badReg.errors.length).toBeGreaterThanOrEqual(3);

    const badLogin = validateLoginInput({ email: 'invalid', password: '' });
    expect(badLogin.valid).toBe(false);
  });
});
