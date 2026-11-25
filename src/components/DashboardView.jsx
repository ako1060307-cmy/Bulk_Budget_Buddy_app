import React from 'react';
import {
  Wallet,
  CreditCard,
  PiggyBank,
  Gauge,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Flame,
  Beef,
  ArrowUpRight,
  Sparkles,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { formatINR } from '../utils/analytics';
import { CATEGORY_META } from '../data/presets';

function NutritionRing({
  label,
  current,
  target,
  unit,
  accentColor,
  trackColor,
  icon: Icon,
  badgeText,
}) {
  const pct = Math.min(Math.round((current / Math.max(target, 1)) * 100), 100);
  const rawPct = Math.round((current / Math.max(target, 1)) * 100);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const remaining = Math.max(target - current, 0);
  const goalHit = current >= target;

  return (
    <div className="flex items-center gap-5 p-4 rounded-xl bg-[#0D1320]/80 border border-[#1F2937] hover:border-slate-700/80 transition-colors">
      <div className="relative h-28 w-28 shrink-0 flex items-center justify-center">
        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 108 108">
          <circle
            cx="54"
            cy="54"
            r={radius}
            fill="transparent"
            stroke={trackColor}
            strokeWidth="9"
          />
          <circle
            cx="54"
            cy="54"
            r={radius}
            fill="transparent"
            stroke={accentColor}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-lg font-bold text-white tabular-inr">{rawPct}%</span>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
            {goalHit ? 'Goal Hit' : 'Today'}
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700/80"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            >
              <Icon className="h-4 w-4" />
            </span>
            <h4 className="text-sm font-semibold text-slate-100">{label}</h4>
          </div>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              goalHit
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800/80 text-slate-300 border-slate-700'
            }`}
          >
            {goalHit ? 'Target Reached' : badgeText}
          </span>
        </div>

        <div className="flex items-baseline gap-1.5 mt-2 tabular-inr">
          <span className="text-2xl font-bold text-white">
            {current.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-400">
            / {target.toLocaleString('en-IN')} {unit}
          </span>
        </div>

        <div className="mt-2.5 h-2 w-full rounded-full bg-slate-800/90 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: accentColor }}
          />
        </div>

        <p className="mt-2 text-xs text-slate-400 tabular-inr">
          {goalHit
            ? `Surplus of +${(current - target).toLocaleString('en-IN')} ${unit} logged today`
            : `${remaining.toLocaleString('en-IN')} ${unit} left to hit Clean Bulk target`}
        </p>
      </div>
    </div>
  );
}

function GlassDonutTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-xl bg-[#0B101B]/95 backdrop-blur-xl border border-slate-700/80 px-3.5 py-2.5 shadow-2xl">
      <div className="flex items-center gap-2 mb-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
        <p className="text-xs font-semibold text-slate-100">{item.name}</p>
      </div>
      <p className="text-sm font-bold text-white tabular-inr">
        {formatINR(item.value)}{' '}
        <span className="text-xs font-medium text-slate-400">({item.pct}%)</span>
      </p>
    </div>
  );
}

function GlassTrendTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const spendEntry = payload.find((p) => p.dataKey === 'spend');
  const calEntry = payload.find((p) => p.dataKey === 'calories');
  return (
    <div className="rounded-xl bg-[#0B101B]/95 backdrop-blur-xl border border-slate-700/80 px-3.5 py-2.5 shadow-2xl min-w-[165px]">
      <p className="text-xs font-semibold text-slate-300 mb-2 border-b border-slate-800 pb-1">
        {label}
      </p>
      {spendEntry && (
        <div className="flex items-center justify-between gap-4 text-xs mb-1">
          <span className="text-cyan-400 font-medium">Daily Spend</span>
          <span className="font-bold text-white tabular-inr">{formatINR(spendEntry.value)}</span>
        </div>
      )}
      {calEntry && (
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="text-emerald-400 font-medium">Calorie Intake</span>
          <span className="font-bold text-white tabular-inr">
            {Number(calEntry.value).toLocaleString('en-IN')} kcal
          </span>
        </div>
      )}
    </div>
  );
}

export default function DashboardView({ metrics, settings, onNavigateLogger }) {
  const {
    monthStats,
    monthlyBudget,
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
    calorieGoal,
    proteinGoal,
    categoryTotals,
    last7Days,
    todayTx,
  } = metrics;

  const kpiCards = [
    {
      title: 'Monthly Budget',
      value: formatINR(monthlyBudget),
      sub: `${monthStats.monthLabel} allocation`,
      badge: `${monthStats.daysLeftInclusive}d left`,
      badgeStyle: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      icon: Wallet,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/15 border-cyan-500/30',
    },
    {
      title: 'Total Spent',
      value: formatINR(totalSpent),
      sub: `${Math.round(budgetUsedPct)}% of monthly limit`,
      badge: alertTier === 'over' ? 'Over Limit' : alertTier === 'critical' ? 'Critical' : alertTier === 'caution' ? 'Watch' : 'Healthy',
      badgeStyle:
        alertTier === 'over'
          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
          : alertTier === 'critical'
          ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
          : alertTier === 'caution'
          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      icon: CreditCard,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/15 border-emerald-500/30',
    },
    {
      title: 'Remaining Balance',
      value: formatINR(remainingBalance),
      sub: remainingBalance >= 0 ? 'Available for remaining days' : 'Exceeded monthly budget',
      badge: remainingBalance >= 0 ? 'Buffer Active' : 'Deficit',
      badgeStyle:
        remainingBalance >= 0
          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          : 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      icon: PiggyBank,
      iconColor: remainingBalance >= 0 ? 'text-emerald-400' : 'text-rose-400',
      iconBg:
        remainingBalance >= 0
          ? 'bg-emerald-500/15 border-emerald-500/30'
          : 'bg-rose-500/15 border-rose-500/30',
    },
    {
      title: 'Safe Daily Spend',
      value: `${formatINR(Math.round(safeDailySpend))}/day`,
      sub: `Today spent: ${formatINR(todaySpend)}`,
      badge: exceedsSafeDaily ? 'Today Exceeded' : 'Within Limit',
      badgeStyle: exceedsSafeDaily
        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
        : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      icon: Gauge,
      iconColor: exceedsSafeDaily ? 'text-amber-400' : 'text-cyan-400',
      iconBg: exceedsSafeDaily
        ? 'bg-amber-500/15 border-amber-500/30'
        : 'bg-cyan-500/15 border-cyan-500/30',
    },
  ];

  const alertConfig = {
    over: {
      wrapper: 'bg-rose-500/10 border-rose-500/40 text-rose-100',
      icon: ShieldAlert,
      iconColor: 'text-rose-400',
      title: `Over-Budget Alert (${Math.round(budgetUsedPct)}% Used)`,
      message: `Monthly spending (${formatINR(totalSpent)}) has exceeded your ${formatINR(monthlyBudget)} budget by ${formatINR(Math.abs(remainingBalance))}. Trim non-essential spends and rely on high-efficiency staples like Sattu & Boiled Eggs.`,
    },
    critical: {
      wrapper: 'bg-orange-500/10 border-orange-500/40 text-orange-100',
      icon: ShieldAlert,
      iconColor: 'text-orange-400',
      title: `Critical Budget Alert (${Math.round(budgetUsedPct)}% Used)`,
      message: `Only ${formatINR(remainingBalance)} left for the next ${monthStats.daysLeftInclusive} days (${formatINR(Math.round(safeDailySpend))}/day). Keep daily intake strictly to high-protein value foods.`,
    },
    caution: {
      wrapper: 'bg-amber-500/10 border-amber-500/35 text-amber-100',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      title: `Caution: ${Math.round(budgetUsedPct)}% of Monthly Budget Used`,
      message: `You have ${formatINR(remainingBalance)} remaining across ${monthStats.daysLeftInclusive} days — keep daily spend near ${formatINR(Math.round(safeDailySpend))}/day to finish on budget.`,
    },
    healthy: {
      wrapper: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      title: `On Track (${Math.round(budgetUsedPct)}% Budget Utilized)`,
      message: `Healthy pacing for ${monthStats.monthLabel}. Safe daily allowance is ${formatINR(Math.round(safeDailySpend))}/day while fueling your Clean Bulk.`,
    },
  }[alertTier];

  const AlertIcon = alertConfig.icon;
  const nonZeroCategories = categoryTotals.filter((c) => c.value > 0);

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-semibold mb-2">
            <Sparkles className="h-3 w-3" />
            <span>{monthStats.monthLabel} • Live Clean Bulk Telemetry</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Dashboard Overview
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Track ₹ burn rate alongside daily calories &amp; protein targets in real time.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateLogger}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-semibold text-sm shadow-glowEmerald hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Quick Log Meal / Expense</span>
        </button>
      </div>

      {/* Dynamic Multi-Tier Alert Banner + Daily Limit Warning */}
      <div className="space-y-3">
        <div className={`glass-card px-4 py-3.5 border ${alertConfig.wrapper} flex items-start gap-3.5`}>
          <div className={`mt-0.5 shrink-0 ${alertConfig.iconColor}`}>
            <AlertIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{alertConfig.title}</p>
              <span className="text-xs font-mono opacity-80 tabular-inr">
                {formatINR(totalSpent)} / {formatINR(monthlyBudget)}
              </span>
            </div>
            <p className="text-xs opacity-85 mt-0.5 leading-relaxed">{alertConfig.message}</p>
          </div>
        </div>

        {exceedsSafeDaily && (
          <div className="glass-card px-4 py-3 border border-rose-500/40 bg-rose-500/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <p className="text-xs sm:text-sm text-rose-100">
                <span className="font-semibold text-rose-300">Daily Pace Warning:</span> Today&apos;s spend (
                <span className="font-mono font-semibold tabular-inr">{formatINR(todaySpend)}</span>) exceeds your Safe Daily Limit (
                <span className="font-mono font-semibold tabular-inr">
                  {formatINR(Math.round(safeDailyLimitForToday))}
                </span>
                /day) by{' '}
                <span className="font-mono font-semibold text-rose-300 tabular-inr">
                  {formatINR(Math.round(todaySpend - safeDailyLimitForToday))}
                </span>
                .
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4 Elevated KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="glass-card-hover p-5 flex flex-col justify-between group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${card.iconBg}`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${card.badgeStyle}`}>
                  {card.badge}
                </span>
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium text-slate-400">{card.title}</p>
                <p className="text-2xl font-bold text-white tracking-tight mt-1 tabular-inr">
                  {card.value}
                </p>
                <p className="text-xs text-slate-400 mt-1.5 tabular-inr">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily "Clean Bulk" Nutrition Rings */}
      <div className="glass-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">
              Today&apos;s &ldquo;Clean Bulk&rdquo; Nutrition Tracker
            </h3>
            <p className="text-xs text-slate-400">
              {todayTx.length} entries logged today • Surplus fueling lean muscle growth
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateLogger}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span>Add Clean Bulk Meal</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <NutritionRing
            label="Daily Calorie Intake"
            current={todayCalories}
            target={calorieGoal}
            unit="kcal"
            accentColor="#10B981"
            trackColor="#1F2937"
            icon={Flame}
            badgeText="Clean Bulk Target"
          />
          <NutritionRing
            label="Daily Protein Intake"
            current={todayProtein}
            target={proteinGoal}
            unit="g"
            accentColor="#06B6D4"
            trackColor="#1F2937"
            icon={Beef}
            badgeText="Muscle Synthesis"
          />
        </div>
      </div>

      {/* 2 Custom-Styled Recharts Visualizations */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Category Donut Chart */}
        <div className="xl:col-span-5 glass-card p-5 flex flex-col">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-white">Monthly Spend by Category</h3>
            <p className="text-xs text-slate-400">Distribution across food, campus transit &amp; academics</p>
          </div>

          <div className="relative h-[240px] w-full flex items-center justify-center">
            {nonZeroCategories.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={nonZeroCategories}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={64}
                      outerRadius={92}
                      paddingAngle={3}
                      stroke="#090D16"
                      strokeWidth={2}
                    >
                      {nonZeroCategories.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<GlassDonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] text-slate-400 font-medium">Total Spent</span>
                  <span className="text-lg font-bold text-white tabular-inr">
                    {formatINR(totalSpent)}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">No expenses logged this month yet.</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-[#1F2937]">
            {categoryTotals.map((cat) => (
              <div
                key={cat.name}
                className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${CATEGORY_META[cat.name].dot}`}
                  />
                  <span className="text-xs text-slate-300 truncate">{cat.shortName}</span>
                </div>
                <div className="text-right shrink-0 tabular-inr">
                  <span className="text-xs font-semibold text-white">{formatINR(cat.value)}</span>
                  <span className="text-[10px] text-slate-400 ml-1">({cat.pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7-Day Dual Bar/Area Chart */}
        <div className="xl:col-span-7 glass-card p-5 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">
                7-Day Daily Spend (₹) vs. Calorie Intake
              </h3>
              <p className="text-xs text-slate-400">
                Correlating ₹ expenditure against daily Clean Bulk energy intake
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-sm bg-cyan-400" />
                Spend (₹)
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                Calories (kcal)
              </span>
            </div>
          </div>

          <div className="h-[290px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={last7Days} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="calAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="spendBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#0891B2" stopOpacity={0.45} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  axisLine={{ stroke: '#1F2937' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v}`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                />
                <Tooltip content={<GlassTrendTooltip />} />
                <Bar
                  yAxisId="left"
                  dataKey="spend"
                  fill="url(#spendBarGrad)"
                  radius={[6, 6, 0, 0]}
                  barSize={26}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="calories"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fill="url(#calAreaGrad)"
                  dot={{ r: 3.5, fill: '#10B981', strokeWidth: 2, stroke: '#090D16' }}
                  activeDot={{ r: 5.5, fill: '#34D399', stroke: '#090D16', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
