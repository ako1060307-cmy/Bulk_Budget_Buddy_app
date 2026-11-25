import React, { useState } from 'react';
import {
  TrendingUp,
  Target,
  Scale,
  Beef,
  Award,
  ArrowUpDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { formatINR } from '../utils/analytics';

function ForecastTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const actual = payload.find((p) => p.dataKey === 'actual');
  const projected = payload.find((p) => p.dataKey === 'projected');
  return (
    <div className="rounded-xl bg-[#0B101B]/95 backdrop-blur-xl border border-slate-700/80 px-3.5 py-2.5 shadow-2xl min-w-[175px]">
      <p className="text-xs font-semibold text-slate-300 mb-1.5 border-b border-slate-800 pb-1">
        {label}
      </p>
      {actual && actual.value != null && (
        <div className="flex items-center justify-between gap-4 text-xs mb-1">
          <span className="text-emerald-400 font-medium">Actual Cumulative</span>
          <span className="font-bold text-white tabular-inr">{formatINR(actual.value)}</span>
        </div>
      )}
      {projected && projected.value != null && (
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="text-cyan-400 font-medium">Projected Path</span>
          <span className="font-bold text-white tabular-inr">{formatINR(projected.value)}</span>
        </div>
      )}
    </div>
  );
}

function EfficiencyTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-xl bg-[#0B101B]/95 backdrop-blur-xl border border-slate-700/80 px-3.5 py-2.5 shadow-2xl max-w-[240px]">
      <p className="text-xs font-semibold text-white mb-1.5 leading-snug">{row.item}</p>
      <div className="space-y-1 text-xs tabular-inr">
        <div className="flex justify-between gap-4">
          <span className="text-emerald-400">₹ / 10g Protein:</span>
          <span className="font-bold text-white">₹{row.inrPer10gProtein}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-cyan-400">₹ / 500 kcal:</span>
          <span className="font-bold text-white">₹{row.inrPer500Kcal ?? '—'}</span>
        </div>
        <div className="flex justify-between gap-4 text-slate-400 pt-1 border-t border-slate-800">
          <span>Avg Portion:</span>
          <span>
            {formatINR(row.avgPrice)} • {row.avgProtein}g P
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsView({ forecast, settings }) {
  const [sortMetric, setSortMetric] = useState('protein');

  const isSurplus = forecast.expectedSurplusOrDeficit >= 0;

  const sortedEfficiency = [...forecast.efficiencyItems].sort((a, b) => {
    if (sortMetric === 'kcal') {
      return (a.inrPer500Kcal ?? 9999) - (b.inrPer500Kcal ?? 9999);
    }
    return a.inrPer10gProtein - b.inrPer10gProtein;
  });

  const chartEfficiency = sortedEfficiency.slice(0, 8).map((item) => ({
    ...item,
    shortName: item.item.length > 18 ? `${item.item.slice(0, 17)}…` : item.item,
  }));

  const forecastCards = [
    {
      title: 'Current Daily Burn Rate',
      value: `${formatINR(Math.round(forecast.burnRate))}/day`,
      sub: `Across ${forecast.activeSpanDays} tracked days in ${forecast.monthStats.monthLabel}`,
      icon: TrendingUp,
      accent: 'text-cyan-400',
      iconBg: 'bg-cyan-500/15 border-cyan-500/30',
    },
    {
      title: 'Projected Month-End Spend',
      value: formatINR(Math.round(forecast.projectedEndOfMonth)),
      sub: `Budget target: ${formatINR(settings.monthlyBudget)}`,
      icon: Target,
      accent: forecast.projectedEndOfMonth > settings.monthlyBudget ? 'text-rose-400' : 'text-emerald-400',
      iconBg:
        forecast.projectedEndOfMonth > settings.monthlyBudget
          ? 'bg-rose-500/15 border-rose-500/30'
          : 'bg-emerald-500/15 border-emerald-500/30',
    },
    {
      title: isSurplus ? 'Expected Month Surplus' : 'Expected Month Deficit',
      value: formatINR(Math.abs(Math.round(forecast.expectedSurplusOrDeficit))),
      sub: isSurplus ? 'Projected savings under monthly cap' : 'Projected overspend vs monthly budget',
      icon: Scale,
      accent: isSurplus ? 'text-emerald-400' : 'text-rose-400',
      iconBg: isSurplus
        ? 'bg-emerald-500/15 border-emerald-500/30'
        : 'bg-rose-500/15 border-rose-500/30',
    },
    {
      title: 'Projected Monthly Protein Spend',
      value: formatINR(Math.round(forecast.projectedMonthlyProteinSpend)),
      sub: `~${formatINR(Math.round(forecast.dailyProteinSpend))}/day • Avg ${Math.round(forecast.avgDailyProtein)}g P/day`,
      icon: Beef,
      accent: 'text-emerald-400',
      iconBg: 'bg-emerald-500/15 border-emerald-500/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Predictive Analytics &amp; Protein Efficiency
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Burn-rate forecasting for {forecast.monthStats.monthLabel} &amp; ₹-efficiency rankings across your Clean Bulk diet.
        </p>
      </div>

      {/* 4 Predictive Forecast Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {forecastCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="glass-card-hover p-5">
              <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${card.iconBg}`}>
                <Icon className={`h-5 w-5 ${card.accent}`} />
              </div>
              <p className="text-xs font-medium text-slate-400 mt-4">{card.title}</p>
              <p className={`text-2xl font-bold tracking-tight mt-1 tabular-inr ${card.accent === 'text-rose-400' ? 'text-rose-400' : 'text-white'}`}>
                {card.value}
              </p>
              <p className="text-xs text-slate-400 mt-1.5 tabular-inr">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Cumulative Spend Forecast Trend Chart */}
      <div className="glass-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">
              End-of-Month Spend Trajectory vs. Budget Cap
            </h3>
            <p className="text-xs text-slate-400">
              Solid emerald curve shows actual cumulative ₹ spend; dashed cyan line projects through Day {forecast.monthStats.totalDays}.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Actual
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-0.5 w-4 border-t-2 border-dashed border-cyan-400" />
              Projected
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-0.5 w-4 border-t-2 border-dashed border-amber-400" />
              Budget ({formatINR(settings.monthlyBudget)})
            </span>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecast.forecastSeries} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="actualForecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="day"
                interval={4}
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                axisLine={{ stroke: '#1F2937' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v}`}
              />
              <Tooltip content={<ForecastTooltip />} />
              <ReferenceLine
                y={settings.monthlyBudget}
                stroke="#F59E0B"
                strokeDasharray="5 5"
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#10B981"
                strokeWidth={2.5}
                fill="url(#actualForecastGrad)"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="projected"
                stroke="#06B6D4"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={false}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Clean Bulk Efficiency Bar Chart + Ranking Table */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Efficiency Bar Chart */}
        <div className="xl:col-span-5 glass-card p-5 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Cost Efficiency Comparison</h3>
              <p className="text-xs text-slate-400">Lower ₹ means higher macro value per rupee</p>
            </div>
            <div className="inline-flex rounded-lg bg-[#090D16] border border-[#1F2937] p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setSortMetric('protein')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  sortMetric === 'protein' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
                }`}
              >
                ₹/10g P
              </button>
              <button
                type="button"
                onClick={() => setSortMetric('kcal')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  sortMetric === 'kcal' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                }`}
              >
                ₹/500 kcal
              </button>
            </div>
          </div>

          <div className="h-[310px] w-full flex-1 flex items-center justify-center">
            {chartEfficiency.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartEfficiency}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 6, bottom: 4 }}
                >
                  <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="shortName"
                    width={122}
                    tick={{ fill: '#CBD5E1', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<EfficiencyTooltip />} />
                  <Bar
                    dataKey={sortMetric === 'protein' ? 'inrPer10gProtein' : 'inrPer500Kcal'}
                    fill={sortMetric === 'protein' ? '#10B981' : '#06B6D4'}
                    radius={[0, 6, 6, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500 text-center px-4">
                Log meals with protein or calories to visualize cost efficiency.
              </p>
            )}
          </div>
        </div>

        {/* Efficiency Ranking Table */}
        <div className="xl:col-span-7 glass-card overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[#1F2937] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-400" />
              <div>
                <h3 className="text-base font-semibold text-white">
                  Clean Bulk Efficiency Ranking Table
                </h3>
                <p className="text-xs text-slate-400">
                  Ranked automatically by ₹ per 10g Protein &amp; ₹ per 500 kcal
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSortMetric((m) => (m === 'protein' ? 'kcal' : 'protein'))}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors self-start sm:self-auto"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-cyan-400" />
              <span>Sorted by: {sortMetric === 'protein' ? '₹ / 10g Protein' : '₹ / 500 kcal'}</span>
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1F2937] bg-[#0B101B]/70 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4 font-semibold">Rank</th>
                  <th className="py-3 px-4 font-semibold">Food Item</th>
                  <th className="py-3 px-4 font-semibold text-right">Avg Cost</th>
                  <th className="py-3 px-4 font-semibold text-right">Macros</th>
                  <th className="py-3 px-4 font-semibold text-right">₹ / 10g P</th>
                  <th className="py-3 px-4 font-semibold text-right">₹ / 500 kcal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]/70 text-sm">
                {sortedEfficiency.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500 text-sm">
                      No protein-bearing meals logged yet. Add a Clean Bulk meal to rank ₹/10g Protein.
                    </td>
                  </tr>
                ) : (
                  sortedEfficiency.map((row, idx) => (
                  <tr key={row.item} className="hover:bg-slate-800/35 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold tabular-inr ${
                          idx === 0
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : idx === 1
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : idx === 2
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-100">{row.item}</p>
                      <p className="text-[11px] text-slate-500">{row.logs} log(s)</p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-200 tabular-inr">
                      {formatINR(row.avgPrice)}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-slate-400 tabular-inr whitespace-nowrap">
                      {row.avgProtein}g P • {row.avgCalories} kcal
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 tabular-inr">
                      ₹{row.inrPer10gProtein}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-cyan-400 tabular-inr">
                      {row.inrPer500Kcal !== null ? `₹${row.inrPer500Kcal}` : '—'}
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
