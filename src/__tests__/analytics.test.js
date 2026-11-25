import { describe, it, expect } from 'vitest';
import {
  computeDashboardMetrics,
  computePredictiveAnalytics,
  getTodayISO,
  getMonthPrefix,
} from '../utils/analytics.js';
import { DEFAULT_SETTINGS } from '../data/presets.js';

describe('Empty Initial State, Budget Alerts, Forecasting & Protein Efficiency', () => {
  const today = getTodayISO();
  const monthPrefix = getMonthPrefix();
  const day01 = `${monthPrefix}-01`;
  const day02 = `${monthPrefix}-02`;

  it('starts cleanly at ₹0 spent, full budget remaining, and 0 kcal / 0g protein with empty transactions', () => {
    const metrics = computeDashboardMetrics([], DEFAULT_SETTINGS);
    expect(metrics.totalSpent).toBe(0);
    expect(metrics.remainingBalance).toBe(DEFAULT_SETTINGS.monthlyBudget);
    expect(metrics.todaySpend).toBe(0);
    expect(metrics.todayCalories).toBe(0);
    expect(metrics.todayProtein).toBe(0);
    expect(metrics.alertTier).toBe('healthy');
    expect(metrics.exceedsSafeDaily).toBe(false);

    const forecast = computePredictiveAnalytics([], DEFAULT_SETTINGS);
    expect(forecast.burnRate).toBe(0);
    expect(forecast.projectedEndOfMonth).toBe(0);
    expect(forecast.expectedSurplusOrDeficit).toBe(DEFAULT_SETTINGS.monthlyBudget);
    expect(forecast.efficiencyItems).toEqual([]);
  });

  it('computes alert tiers (healthy <75%, caution >=75%, critical >=90%, over >100%)', () => {
    const makeTx = (amount, date = day01) => [
      { id: '1', date, item: 'Test', amount, category: 'Clean Bulk Groceries', calories: 500, protein: 20 },
    ];

    expect(computeDashboardMetrics(makeTx(4000), DEFAULT_SETTINGS).alertTier).toBe('healthy');
    expect(computeDashboardMetrics(makeTx(6000), DEFAULT_SETTINGS).alertTier).toBe('caution');
    expect(computeDashboardMetrics(makeTx(7200), DEFAULT_SETTINGS).alertTier).toBe('critical');
    expect(computeDashboardMetrics(makeTx(8500), DEFAULT_SETTINGS).alertTier).toBe('over');
  });

  it('flags when today spend exceeds safe daily limit', () => {
    const tx = [
      { id: '1', date: today, item: 'Expensive Dinner', amount: 2500, category: 'Mess/Dining', calories: 800, protein: 30 },
    ];
    const metrics = computeDashboardMetrics(tx, { ...DEFAULT_SETTINGS, monthlyBudget: 3000 });
    expect(metrics.exceedsSafeDaily).toBe(true);
  });

  it('calculates burn rate, month-end projection, and surplus/deficit accurately', () => {
    const tx = [
      { id: '1', date: day01, item: 'Sattu (100g) + Sugar', amount: 200, category: 'Clean Bulk Groceries', calories: 410, protein: 20 },
      { id: '2', date: day02, item: 'Paneer (200g)', amount: 400, category: 'Clean Bulk Groceries', calories: 530, protein: 36 },
    ];
    const forecast = computePredictiveAnalytics(tx, DEFAULT_SETTINGS);
    expect(forecast.burnRate).toBe(300);
    expect(forecast.projectedEndOfMonth).toBe(
      600 + 300 * forecast.monthStats.daysRemainingAfterToday
    );
    expect(forecast.expectedSurplusOrDeficit).toBe(
      DEFAULT_SETTINGS.monthlyBudget - forecast.projectedEndOfMonth
    );
  });

  it('ranks Clean Bulk foods accurately by ₹ per 10g Protein and ₹ per 500 kcal', () => {
    const tx = [
      { id: 'a', date: today, item: 'Paneer (200g)', amount: 90, category: 'Clean Bulk Groceries', calories: 530, protein: 36 },
      { id: 'b', date: today, item: 'Sattu (100g) + Sugar', amount: 22, category: 'Clean Bulk Groceries', calories: 410, protein: 20 },
      { id: 'c', date: today, item: '4 Boiled Eggs', amount: 32, category: 'Clean Bulk Groceries', calories: 310, protein: 25 },
      { id: 'd', date: today, item: 'Toned Milk (1L)', amount: 56, category: 'Clean Bulk Groceries', calories: 600, protein: 30 },
    ];
    const forecast = computePredictiveAnalytics(tx, DEFAULT_SETTINGS);
    const items = forecast.efficiencyItems;

    expect(items.map((i) => i.item)).toEqual([
      'Sattu (100g) + Sugar',
      '4 Boiled Eggs',
      'Toned Milk (1L)',
      'Paneer (200g)',
    ]);
    expect(items[0].inrPer10gProtein).toBe(11);
    expect(items[1].inrPer10gProtein).toBe(12.8);
    expect(items[0].inrPer500Kcal).toBe(26.8);
  });

  it('guards against division by zero for zero goals, empty logs, or zero macros', () => {
    const emptyMetrics = computeDashboardMetrics([], {
      monthlyBudget: 0,
      calorieGoal: 0,
      proteinGoal: 0,
    });
    expect(Number.isFinite(emptyMetrics.budgetUsedPct)).toBe(true);
    expect(Number.isFinite(emptyMetrics.safeDailySpend)).toBe(true);

    const zeroMacroTx = [
      { id: 'z1', date: today, item: 'Auto', amount: 40, category: 'Transport', calories: 0, protein: 0 },
      { id: 'z2', date: today, item: 'Banana ZeroP', amount: 20, category: 'Clean Bulk Groceries', calories: 200, protein: 0 },
    ];
    const emptyForecast = computePredictiveAnalytics(zeroMacroTx, { monthlyBudget: 0 });
    expect(Number.isFinite(emptyForecast.burnRate)).toBe(true);
    expect(emptyForecast.efficiencyItems.length).toBe(0);
  });
});
