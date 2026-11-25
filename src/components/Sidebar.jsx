import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  TrendingUp,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { formatINR } from '../utils/analytics';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', fullLabel: 'Dashboard Overview', icon: LayoutDashboard },
  { id: 'logger', label: 'Quick Log', fullLabel: 'Expense & Meal Logger', icon: PlusCircle },
  { id: 'analytics', label: 'Analytics', fullLabel: 'Forecast & Efficiency', icon: TrendingUp },
  { id: 'settings', label: 'Exports', fullLabel: 'Exports & Settings', icon: SlidersHorizontal },
];

export default function Sidebar({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  settings,
  metrics,
  syncMode = 'local',
  user,
  onLogout,
}) {
  const budgetPct = Math.min(Math.round(metrics.budgetUsedPct), 999);
  const displayName = user?.name || settings.studentName;
  const displayEmail = user?.email || `${settings.department} • ${settings.rollNo}`;

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-[#1F2937] bg-[#0B101B]/95 backdrop-blur-xl transition-all duration-300 ease-out sticky top-0 h-screen z-30 ${
          collapsed ? 'w-[78px]' : 'w-[264px]'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-[#1F2937]/80">
          <div className={`flex items-center gap-3 overflow-hidden ${collapsed ? 'justify-center w-full' : ''}`}>
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 shadow-glowEmerald">
              <Dumbbell className="h-5 w-5 text-emerald-400" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0B101B]" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-sm font-bold tracking-tight text-white truncate">
                  Bulk Budget Buddy
                </h1>
                <p className="text-[11px] font-medium text-emerald-400/90 truncate">
                  Clean Bulk &amp; ₹ Tracker
                </p>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {collapsed && (
          <div className="flex justify-center pt-3">
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1.5">
          {!collapsed && (
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Navigation
            </p>
          )}
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                title={collapsed ? item.fullLabel : undefined}
                className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                    isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.fullLabel}</span>}
              </button>
            );
          })}
        </nav>

        {/* Live Month Pulse Pill */}
        {!collapsed && (
          <div className="mx-3 mb-3 p-3.5 rounded-xl bg-[#111827]/90 border border-[#1F2937]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-cyan-400" />
                Month Burn
              </span>
              <span className="font-mono font-semibold text-slate-200 tabular-inr">
                {budgetPct}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetPct > 100
                    ? 'bg-rose-500'
                    : budgetPct >= 90
                    ? 'bg-orange-500'
                    : budgetPct >= 75
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(budgetPct, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 tabular-inr">
              <span>{formatINR(metrics.totalSpent)} spent</span>
              <span>of {formatINR(settings.monthlyBudget)}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Storage Sync</span>
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  syncMode === 'api' ? 'text-emerald-400' : 'text-cyan-400'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    syncMode === 'api' ? 'bg-emerald-400' : 'bg-cyan-400'
                  }`}
                />
                {syncMode === 'api' ? 'Express API' : 'LocalStorage'}
              </span>
            </div>
          </div>
        )}

        {/* Logged-in User Profile Card + Logout */}
        <div className="p-3 border-t border-[#1F2937]/80 space-y-2">
          <div
            className={`flex items-center gap-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 p-2.5 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <UserCheck className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-200 truncate">{displayName}</p>
                <p className="text-[10px] text-slate-400 truncate">{displayEmail}</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="Logout"
            className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-900/50 border border-[#1F2937] hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 transition-colors ${
              collapsed ? 'justify-center px-0' : 'justify-center'
            }`}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[#1F2937] bg-[#0B101B]/95 backdrop-blur-xl px-2 py-1.5 safe-area-pb">
        <div className="grid grid-cols-4 gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
