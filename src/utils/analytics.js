import { CATEGORIES, CATEGORY_META } from '../data/presets.js';

export function formatINR(value, decimals = 0) {
  const num = Number(value) || 0;
  const absFormatted = Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return num < 0 ? `-₹${absFormatted}` : `₹${absFormatted}`;
}

export function getTodayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getMonthPrefix(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getMonthStats(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const dayOfMonth = date.getDate();
  const daysLeftInclusive = Math.max(totalDays - dayOfMonth + 1, 1);
  const daysRemainingAfterToday = Math.max(totalDays - dayOfMonth, 0);
  const monthLabel = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  return {
    year,
    month,
    totalDays,
    dayOfMonth,
    daysLeftInclusive,
    daysRemainingAfterToday,
    monthLabel,
    monthPrefix: getMonthPrefix(date),
  };
}

export function formatDateLabel(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function computeDashboardMetrics(transactions, settings) {
  const todayISO = getTodayISO();
  const monthStats = getMonthStats(new Date());
  const monthlyBudget = Math.max(Number(settings.monthlyBudget) || 0, 1);
  const calorieGoal = Math.max(Number(settings.calorieGoal) || 1, 1);
  const proteinGoal = Math.max(Number(settings.proteinGoal) || 1, 1);

  const monthTx = transactions.filter((t) => t.date.startsWith(monthStats.monthPrefix));
  const todayTx = transactions.filter((t) => t.date === todayISO);

  const totalSpent = monthTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const remainingBalance = monthlyBudget - totalSpent;
  const budgetUsedPct = (totalSpent / monthlyBudget) * 100;

  // Safe daily spend across remaining days of the month (excluding today's overspend logic or remaining/days left)
  // Using remaining balance before/including today vs days left gives a clear daily budget ceiling:
  const spentBeforeToday = monthTx
    .filter((t) => t.date !== todayISO)
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const todaySpend = todayTx.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Safe daily limit available for today (and each remaining day):
  const remainingAtStartOfToday = Math.max(monthlyBudget - spentBeforeToday, 0);
  const safeDailyLimitForToday = remainingAtStartOfToday / monthStats.daysLeftInclusive;
  const safeDailySpend = Math.max(remainingBalance, 0) / monthStats.daysLeftInclusive;

  const exceedsSafeDaily = todaySpend > safeDailyLimitForToday && safeDailyLimitForToday >= 0;

  let alertTier = 'healthy';
  if (budgetUsedPct > 100) {
    alertTier = 'over';
  } else if (budgetUsedPct >= 90) {
    alertTier = 'critical';
  } else if (budgetUsedPct >= 75) {
    alertTier = 'caution';
  }

  const todayCalories = todayTx.reduce((sum, t) => sum + (Number(t.calories) || 0), 0);
  const todayProtein = todayTx.reduce((sum, t) => sum + (Number(t.protein) || 0), 0);

  // Category Donut data (current month)
  const categoryTotals = CATEGORIES.map((cat) => {
    const amount = monthTx
      .filter((t) => t.category === cat)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    return {
      name: cat,
      shortName: CATEGORY_META[cat].shortLabel,
      value: amount,
      color: CATEGORY_META[cat].color,
      pct: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
    };
  });

  // 7-day Spend vs Calorie Intake
  const last7Days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${day}`;
    const dayTx = transactions.filter((t) => t.date === iso);
    const spend = dayTx.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const calories = dayTx.reduce((s, t) => s + (Number(t.calories) || 0), 0);
    const protein = dayTx.reduce((s, t) => s + (Number(t.protein) || 0), 0);
    last7Days.push({
      date: iso,
      label: i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
      shortDay: i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      spend,
      calories,
      protein,
    });
  }

  return {
    todayISO,
    monthStats,
    monthlyBudget,
    calorieGoal,
    proteinGoal,
    monthTx,
    todayTx,
    totalSpent,
    remainingBalance,
    budgetUsedPct,
    todaySpend,
    safeDailySpend,
    safeDailyLimitForToday,
    exceedsSafeDaily,
    alertTier,
    todayCalories,
    todayProtein,
    categoryTotals,
    last7Days,
  };
}

export function computePredictiveAnalytics(transactions, settings) {
  const monthStats = getMonthStats(new Date());
  const monthlyBudget = Math.max(Number(settings.monthlyBudget) || 0, 1);
  const monthTx = transactions.filter((t) => t.date.startsWith(monthStats.monthPrefix));

  // Count active tracking days in current month or elapsed days in month
  const distinctDates = new Set(monthTx.map((t) => t.date));
  const activeSpanDays = Math.max(distinctDates.size, 1);

  const totalSpent = monthTx.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  // Daily burn rate based on active tracked days in month (gives realistic rate even if demo starts mid-month)
  const burnRate = totalSpent / activeSpanDays;
  const projectedEndOfMonth = totalSpent + burnRate * monthStats.daysRemainingAfterToday;
  const expectedSurplusOrDeficit = monthlyBudget - projectedEndOfMonth;

  // Protein-focused spend: entries with protein > 0 (or Clean Bulk Groceries)
  const proteinTx = monthTx.filter((t) => Number(t.protein) > 0);
  const proteinSpendSoFar = proteinTx.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const proteinGramsSoFar = proteinTx.reduce((s, t) => s + (Number(t.protein) || 0), 0);
  const caloriesSoFar = monthTx.reduce((s, t) => s + (Number(t.calories) || 0), 0);

  const dailyProteinSpend = proteinSpendSoFar / activeSpanDays;
  const projectedMonthlyProteinSpend = proteinSpendSoFar + dailyProteinSpend * monthStats.daysRemainingAfterToday;
  const avgDailyProtein = proteinGramsSoFar / activeSpanDays;
  const avgDailyCalories = caloriesSoFar / activeSpanDays;

  // Build cumulative forecast series across all days of current month
  const dailySpendMap = new Map();
  monthTx.forEach((t) => {
    const dayNum = Number(t.date.split('-')[2]);
    dailySpendMap.set(dayNum, (dailySpendMap.get(dayNum) || 0) + (Number(t.amount) || 0));
  });

  const forecastSeries = [];
  let runningActual = 0;
  for (let d = 1; d <= monthStats.totalDays; d += 1) {
    const daySpend = dailySpendMap.get(d) || 0;
    if (d <= monthStats.dayOfMonth) {
      runningActual += daySpend;
      forecastSeries.push({
        day: `Day ${d}`,
        dayNum: d,
        actual: Math.round(runningActual),
        projected: d === monthStats.dayOfMonth ? Math.round(runningActual) : null,
        budgetLine: monthlyBudget,
      });
    } else {
      const daysAhead = d - monthStats.dayOfMonth;
      forecastSeries.push({
        day: `Day ${d}`,
        dayNum: d,
        actual: null,
        projected: Math.round(runningActual + burnRate * daysAhead),
        budgetLine: monthlyBudget,
      });
    }
  }

  // Clean Bulk Efficiency Ranking across food entries (all transactions with protein > 0 or calories > 0)
  const foodGroups = new Map();
  transactions.forEach((t) => {
    const cal = Number(t.calories) || 0;
    const prot = Number(t.protein) || 0;
    const amt = Number(t.amount) || 0;
    if ((prot <= 0 && cal <= 0) || amt <= 0) return;

    const key = t.item.trim();
    if (!foodGroups.has(key)) {
      foodGroups.set(key, {
        item: key,
        category: t.category,
        logs: 0,
        totalAmount: 0,
        totalCalories: 0,
        totalProtein: 0,
      });
    }
    const g = foodGroups.get(key);
    g.logs += 1;
    g.totalAmount += amt;
    g.totalCalories += cal;
    g.totalProtein += prot;
  });

  const efficiencyItems = Array.from(foodGroups.values())
    .map((g) => {
      const avgPrice = g.totalAmount / g.logs;
      const avgCalories = g.totalCalories / g.logs;
      const avgProtein = g.totalProtein / g.logs;
      const inrPer10gProtein = avgProtein > 0 ? Number(((avgPrice / avgProtein) * 10).toFixed(1)) : null;
      const inrPer500Kcal = avgCalories > 0 ? Number(((avgPrice / avgCalories) * 500).toFixed(1)) : null;
      const proteinPer100INR = avgPrice > 0 ? Number(((avgProtein / avgPrice) * 100).toFixed(1)) : 0;
      return {
        ...g,
        avgPrice: Math.round(avgPrice),
        avgCalories: Math.round(avgCalories),
        avgProtein: Math.round(avgProtein),
        inrPer10gProtein,
        inrPer500Kcal,
        proteinPer100INR,
      };
    })
    .filter((item) => item.inrPer10gProtein !== null)
    .sort((a, b) => a.inrPer10gProtein - b.inrPer10gProtein);

  return {
    monthStats,
    activeSpanDays,
    totalSpent,
    burnRate,
    projectedEndOfMonth,
    expectedSurplusOrDeficit,
    proteinSpendSoFar,
    dailyProteinSpend,
    projectedMonthlyProteinSpend,
    avgDailyProtein,
    avgDailyCalories,
    forecastSeries,
    efficiencyItems,
  };
}
