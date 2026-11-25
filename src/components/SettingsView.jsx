import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  RotateCcw,
  Save,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Database,
} from 'lucide-react';
import { exportTransactionsCSV, exportPDFReport } from '../utils/exporters';
import { formatINR } from '../utils/analytics';

export default function SettingsView({
  settings,
  onUpdateSettings,
  onResetDemo,
  transactions,
  metrics,
  forecast,
  user,
}) {
  const [monthlyBudget, setMonthlyBudget] = useState(String(settings.monthlyBudget));
  const [calorieGoal, setCalorieGoal] = useState(String(settings.calorieGoal));
  const [proteinGoal, setProteinGoal] = useState(String(settings.proteinGoal));
  const [savedNotice, setSavedNotice] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [exportNotice, setExportNotice] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setMonthlyBudget(String(settings.monthlyBudget));
    setCalorieGoal(String(settings.calorieGoal));
    setProteinGoal(String(settings.proteinGoal));
  }, [settings]);

  const handleSave = async (e) => {
    e.preventDefault();
    const nextBudget = Number(monthlyBudget);
    const nextCal = Number(calorieGoal);
    const nextProt = Number(proteinGoal);

    const res = await onUpdateSettings({
      ...settings,
      monthlyBudget: nextBudget,
      calorieGoal: nextCal,
      proteinGoal: nextProt,
    });
    if (res && !res.ok) {
      setSettingsError(res.error || 'Invalid goal values.');
      return;
    }
    setSettingsError('');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  const handleCSV = () => {
    exportTransactionsCSV(transactions);
    setExportNotice('CSV exported to your downloads folder.');
    setTimeout(() => setExportNotice(''), 2600);
  };

  const handlePDF = () => {
    exportPDFReport({ transactions, settings, metrics, forecast });
    setExportNotice('Formatted PDF report generated & downloaded.');
    setTimeout(() => setExportNotice(''), 2600);
  };

  const handleReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    await onResetDemo();
    setConfirmReset(false);
    setExportNotice('Account cleared to ₹0 and restored to default budget & macro targets.');
    setTimeout(() => setExportNotice(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Exports &amp; Goal Settings
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Download formatted CSV/PDF reports, customize monthly ₹ &amp; macro goals, or clear account entries.
        </p>
      </div>

      {exportNotice && (
        <div className="glass-card px-4 py-3 border border-emerald-500/40 bg-emerald-500/10 flex items-center gap-2.5 text-sm text-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editable Goals Form */}
        <form onSubmit={handleSave} className="lg:col-span-7 glass-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sliders className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Budget &amp; Clean Bulk Targets</h3>
                <p className="text-xs text-slate-400">Changes persist automatically in localStorage</p>
              </div>
            </div>
            {savedNotice && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Saved!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Monthly Budget (₹)
              </label>
              <input
                type="number"
                min="500"
                step="100"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                className="w-full rounded-xl bg-[#090D16] border border-[#1F2937] focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 px-3.5 py-2.5 text-sm font-mono font-semibold text-white tabular-inr outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default: ₹8,000</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Daily Calorie Goal (kcal)
              </label>
              <input
                type="number"
                min="1200"
                step="50"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(e.target.value)}
                className="w-full rounded-xl bg-[#090D16] border border-[#1F2937] focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 px-3.5 py-2.5 text-sm font-mono font-semibold text-white tabular-inr outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default: 3,300 kcal</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Daily Protein Goal (g)
              </label>
              <input
                type="number"
                min="30"
                step="5"
                value={proteinGoal}
                onChange={(e) => setProteinGoal(e.target.value)}
                className="w-full rounded-xl bg-[#090D16] border border-[#1F2937] focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 px-3.5 py-2.5 text-sm font-mono font-semibold text-white tabular-inr outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default: 140g</p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            {settingsError ? (
              <span className="text-xs font-medium text-rose-400">{settingsError}</span>
            ) : (
              <div className="text-xs text-slate-400">
                Active target:{' '}
                <span className="text-slate-200 font-semibold tabular-inr">
                  {formatINR(settings.monthlyBudget)}/mo
                </span>{' '}
                • {settings.calorieGoal.toLocaleString('en-IN')} kcal • {settings.proteinGoal}g P
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <Save className="h-4 w-4" />
              <span>Save Goals</span>
            </button>
          </div>
        </form>

        {/* Exports & Demo Reset Panel */}
        <div className="lg:col-span-5 space-y-5">
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#1F2937] pb-3.5">
              <div className="h-9 w-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Export Financial &amp; Macro Reports</h3>
                <p className="text-xs text-slate-400">{transactions.length} transactions ready for export</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              <button
                type="button"
                onClick={handleCSV}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#090D16] border border-[#1F2937] hover:border-cyan-500/50 hover:bg-slate-900/90 transition-all group"
              >
                <div className="flex items-center gap-3 text-left">
                  <Download className="h-5 w-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-sm font-semibold text-white">Export CSV</p>
                    <p className="text-[11px] text-slate-400">Full spreadsheet with ₹, kcal &amp; protein</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-cyan-400">.CSV</span>
              </button>

              <button
                type="button"
                onClick={handlePDF}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#090D16] border border-[#1F2937] hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all group"
              >
                <div className="flex items-center gap-3 text-left">
                  <FileText className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-sm font-semibold text-white">Export PDF Report</p>
                    <p className="text-[11px] text-slate-400">Executive summary, rankings &amp; ledger via jsPDF</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-emerald-400">.PDF</span>
              </button>
            </div>
          </div>

          <div className="glass-card p-6 space-y-3 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                <h4 className="text-sm font-semibold text-white">Account Reset &amp; Attribution</h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">{settings.rollNo}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Signed in as <span className="text-slate-200 font-medium">{user?.name || settings.studentName}</span> ({user?.email || settings.department}). Clearing account data resets logged transactions to ₹0 and restores default goals.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                confirmReset
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-200 hover:bg-rose-500/30'
                  : 'bg-slate-900/70 border-[#1F2937] text-slate-300 hover:border-amber-500/40 hover:text-amber-300'
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>
                {confirmReset ? 'Click again to confirm Clear Account Data' : 'Clear Account Entries (Reset to ₹0)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
