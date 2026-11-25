import React, { useMemo, useState } from 'react';
import {
  Sparkles,
  Search,
  Trash2,
  Zap,
  Plus,
  Filter,
  Flame,
  Beef,
  Check,
  Calendar,
} from 'lucide-react';
import { CATEGORIES, CATEGORY_META, CLEAN_BULK_PRESETS } from '../data/presets';
import { parseQuickInput } from '../utils/parser';
import { formatINR, formatDateLabel, getTodayISO } from '../utils/analytics';

export default function LoggerView({ transactions, onAddTransaction, onDeleteTransaction }) {
  const [quickText, setQuickText] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [overrideCategory, setOverrideCategory] = useState('');
  const [overrideCalories, setOverrideCalories] = useState('');
  const [overrideProtein, setOverrideProtein] = useState('');
  const [justAddedId, setJustAddedId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [formError, setFormError] = useState('');

  const parsed = useMemo(() => parseQuickInput(quickText), [quickText]);

  const effectiveCategory = overrideCategory || parsed?.category || 'Clean Bulk Groceries';
  const effectiveCalories =
    overrideCalories !== '' ? Number(overrideCalories) || 0 : parsed?.calories || 0;
  const effectiveProtein =
    overrideProtein !== '' ? Number(overrideProtein) || 0 : parsed?.protein || 0;

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!parsed) {
      setFormError('Enter an item and positive ₹ amount (e.g. "Paneer 200g 90").');
      return;
    }
    if (parsed.error) {
      setFormError(parsed.error);
      return;
    }

    const res = await onAddTransaction({
      date: selectedDate || getTodayISO(),
      item: parsed.item,
      amount: parsed.amount,
      category: effectiveCategory,
      calories: effectiveCalories,
      protein: effectiveProtein,
    });

    if (res && !res.ok) {
      setFormError(res.error || 'Could not log entry.');
      return;
    }

    setFormError('');
    setQuickText('');
    setOverrideCategory('');
    setOverrideCalories('');
    setOverrideProtein('');
  };

  const handlePresetClick = (preset) => {
    onAddTransaction({
      date: selectedDate || getTodayISO(),
      item: preset.item,
      amount: preset.amount,
      category: preset.category,
      calories: preset.calories,
      protein: preset.protein,
    });
    setJustAddedId(preset.id);
    setTimeout(() => {
      setJustAddedId((prev) => (prev === preset.id ? null : prev));
    }, 1100);
  };

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchesCat = categoryFilter === 'All' || t.category === categoryFilter;
      const matchesSearch =
        !q ||
        t.item.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.date.includes(q);
      return matchesCat && matchesSearch;
    });
  }, [transactions, searchQuery, categoryFilter]);

  const filteredTotals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, t) => ({
        amount: acc.amount + (Number(t.amount) || 0),
        calories: acc.calories + (Number(t.calories) || 0),
        protein: acc.protein + (Number(t.protein) || 0),
      }),
      { amount: 0, calories: 0, protein: 0 }
    );
  }, [filteredTransactions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Smart Expense &amp; Meal Logger
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Type natural text like <code className="text-emerald-400 font-mono">&ldquo;Paneer 200g 90&rdquo;</code> or tap a Clean Bulk preset.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2">
          <Calendar className="h-4 w-4 text-cyan-400" />
          <span className="text-xs text-slate-400 font-medium">Log Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-100 focus:outline-none tabular-inr"
          />
        </div>
      </div>

      {/* Natural-Text Quick Parser Bar */}
      <form onSubmit={handleQuickSubmit} className="glass-card p-5 border border-emerald-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Natural-Text Quick Parser</h3>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            • Extracts item, ₹ price, category &amp; smart macros automatically
          </span>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={quickText}
              onChange={(e) => {
                setQuickText(e.target.value);
                setFormError('');
                setOverrideCategory('');
                setOverrideCalories('');
                setOverrideProtein('');
              }}
              placeholder='Try "Paneer 200g 90", "Auto 40", "Mess thali 75", or "Lab file 85"'
              className="w-full rounded-xl bg-[#090D16] border border-[#1F2937] focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={!parsed || Boolean(parsed.error) || parsed.amount <= 0}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98] transition-all shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Log Entry</span>
          </button>
        </div>

        {(formError || parsed?.error) && quickText.trim() && (
          <p className="mt-2.5 text-xs font-medium text-rose-400">
            {formError || parsed.error}
          </p>
        )}

        {/* Live Parsed Preview & Optional Tweaks */}
        {quickText.trim() && parsed && (
          <div className="mt-3.5 pt-3.5 border-t border-[#1F2937] flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-400 font-medium">Parsed Preview:</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-white font-semibold">
              {parsed.item}
            </span>
            <span
              className={`px-2.5 py-1 rounded-lg font-mono font-bold tabular-inr border ${
                parsed.amount > 0
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              }`}
            >
              {parsed.amount > 0 ? formatINR(parsed.amount) : 'Enter ₹ amount'}
            </span>

            <select
              value={effectiveCategory}
              onChange={(e) => setOverrideCategory(e.target.value)}
              className="rounded-lg bg-[#090D16] border border-slate-700 px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 bg-[#090D16] border border-slate-700 rounded-lg px-2 py-1">
              <Flame className="h-3.5 w-3.5 text-emerald-400" />
              <input
                type="number"
                min="0"
                value={overrideCalories !== '' ? overrideCalories : parsed.calories}
                onChange={(e) => setOverrideCalories(e.target.value)}
                className="w-14 bg-transparent text-slate-100 font-mono text-xs focus:outline-none tabular-inr"
              />
              <span className="text-slate-400">kcal</span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#090D16] border border-slate-700 rounded-lg px-2 py-1">
              <Beef className="h-3.5 w-3.5 text-cyan-400" />
              <input
                type="number"
                min="0"
                value={overrideProtein !== '' ? overrideProtein : parsed.protein}
                onChange={(e) => setOverrideProtein(e.target.value)}
                className="w-12 bg-transparent text-slate-100 font-mono text-xs focus:outline-none tabular-inr"
              />
              <span className="text-slate-400">g P</span>
            </div>
          </div>
        )}
      </form>

      {/* One-Click Indian Clean Bulk Preset Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            <h3 className="text-base font-semibold text-white">
              One-Click Indian Clean Bulk Presets
            </h3>
          </div>
          <span className="text-xs text-slate-400">Click any card to log instantly</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {CLEAN_BULK_PRESETS.map((preset) => {
            const isAdded = justAddedId === preset.id;
            const rsPer10gP = ((preset.amount / preset.protein) * 10).toFixed(1);
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className={`group text-left glass-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/45 active:scale-[0.98] ${
                  isAdded ? 'border-emerald-400 bg-emerald-500/10 shadow-glowEmerald' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/80">
                    {preset.tag}
                  </span>
                  <span className="text-sm font-bold text-emerald-400 font-mono tabular-inr">
                    {formatINR(preset.amount)}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-2 min-h-[2.5rem]">
                  {preset.item}
                </h4>

                <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#1F2937]">
                  <div className="flex items-center gap-2 text-[11px] font-medium tabular-inr">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {preset.calories} kcal
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {preset.protein}g P
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold transition-colors ${
                      isAdded ? 'text-emerald-300' : 'text-slate-400 group-hover:text-emerald-400'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Added
                      </>
                    ) : (
                      <>₹{rsPer10gP}/10g</>
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Searchable & Filterable Transaction Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#1F2937] space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">Transaction &amp; Meal Ledger</h3>
              <p className="text-xs text-slate-400 tabular-inr">
                Showing {filteredTransactions.length} items • Total:{' '}
                <span className="text-slate-200 font-semibold">{formatINR(filteredTotals.amount)}</span>{' '}
                • {filteredTotals.calories.toLocaleString('en-IN')} kcal • {filteredTotals.protein}g Protein
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search item, category, date..."
                className="w-full rounded-xl bg-[#090D16] border border-[#1F2937] focus:border-cyan-500/60 pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 mr-1">
              <Filter className="h-3.5 w-3.5" />
              Filter:
            </span>
            {['All', ...CATEGORIES].map((cat) => {
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1F2937] bg-[#0B101B]/70 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Item / Meal</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Macros</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]/70 text-sm">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-sm">
                    {transactions.length === 0
                      ? 'No expenses or meals logged yet. Use the Quick Parser above or tap a Clean Bulk preset!'
                      : 'No matching expenses or meals found.'}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const meta = CATEGORY_META[tx.category] || CATEGORY_META['Academic & Misc'];
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-800/35 transition-colors group"
                    >
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-400 tabular-inr">
                        <span className="text-slate-200 font-medium">{formatDateLabel(tx.date)}</span>
                        {tx.time && <span className="block text-[10px] text-slate-500">{tx.time}</span>}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-100">
                        {tx.item}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${meta.bg} ${meta.text} ${meta.border}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {tx.calories > 0 || tx.protein > 0 ? (
                          <div className="flex items-center gap-1.5 text-[11px] tabular-inr">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              {tx.calories} kcal
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                              {tx.protein}g P
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-semibold text-white tabular-inr">
                        {formatINR(tx.amount)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(tx.id)}
                          aria-label={`Delete ${tx.item}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
