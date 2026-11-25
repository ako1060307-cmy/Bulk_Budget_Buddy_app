import { describe, it, expect } from 'vitest';
import { parseQuickInput } from '../utils/parser.js';

describe('Natural-Text Quick Parser', () => {
  it('parses Clean Bulk grocery with weight and ₹ price', () => {
    const res = parseQuickInput('Paneer 200g 90');
    expect(res).not.toBeNull();
    expect(res.item).toBe('Paneer 200g');
    expect(res.amount).toBe(90);
    expect(res.category).toBe('Clean Bulk Groceries');
    expect(res.calories).toBe(530);
    expect(res.protein).toBe(36);
    expect(res.error).toBeNull();
  });

  it('parses Transport expense accurately', () => {
    const res = parseQuickInput('Auto 40');
    expect(res.item).toBe('Auto');
    expect(res.amount).toBe(40);
    expect(res.category).toBe('Transport');
    expect(res.calories).toBe(0);
    expect(res.protein).toBe(0);
    expect(res.error).toBeNull();
  });

  it('parses ₹ prefix and volume units without confusing unit numbers for price', () => {
    const res = parseQuickInput('₹56 Toned Milk 1L');
    expect(res.item).toBe('Toned Milk 1L');
    expect(res.amount).toBe(56);
    expect(res.category).toBe('Clean Bulk Groceries');
    expect(res.protein).toBe(30);
    expect(res.error).toBeNull();
  });

  it('parses Mess/Dining and Academic & Misc items', () => {
    const mess = parseQuickInput('Mess thali 75');
    expect(mess.category).toBe('Mess/Dining');
    expect(mess.amount).toBe(75);
    expect(mess.calories).toBeGreaterThan(0);

    const acad = parseQuickInput('CSD Lab file printout 85');
    expect(acad.category).toBe('Academic & Misc');
    expect(acad.amount).toBe(85);
    expect(acad.calories).toBe(0);
  });

  it('flags negative, zero, or missing prices', () => {
    const neg = parseQuickInput('Paneer -90');
    expect(neg.error).toBeTruthy();

    const zero = parseQuickInput('Eggs 0');
    expect(zero.error).toBeTruthy();

    const missing = parseQuickInput('Banana');
    expect(missing.error).toBeTruthy();
  });

  it('detects and blocks XSS payloads in quick input', () => {
    const xss = parseQuickInput('<script>alert(1)</script> Paneer 90');
    expect(xss.unsafe).toBe(true);
    expect(xss.error).toMatch(/unsafe/i);
  });
});
