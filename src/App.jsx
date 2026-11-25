import React, { useEffect, useMemo, useState } from 'react';
import { Dumbbell, LogOut, Menu, X } from 'lucide-react';
import Sidebar, { NAV_ITEMS } from './components/Sidebar';
import AuthGateway from './components/AuthGateway';
import DashboardView from './components/DashboardView';
import LoggerView from './components/LoggerView';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';
import { DEFAULT_SETTINGS } from './data/presets';
import {
  computeDashboardMetrics,
  computePredictiveAnalytics,
} from './utils/analytics';
import {
  createEntry,
  hydrateUserSession,
  logoutAccount,
  removeEntry,
  resetAccountData,
  updateSettingsRemote,
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [syncMode, setSyncMode] = useState('local');

  useEffect(() => {
    let active = true;
    hydrateUserSession().then((res) => {
      if (!active) return;
      if (res.authenticated && res.user) {
        setSession({ token: res.token, user: res.user, syncMode: res.syncMode });
        setTransactions(res.entries || []);
        setSettings(res.settings || DEFAULT_SETTINGS);
        setSyncMode(res.syncMode);
      } else {
        setSession(null);
        setTransactions([]);
        setSettings(DEFAULT_SETTINGS);
      }
      setAuthReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(
    () => computeDashboardMetrics(transactions, settings),
    [transactions, settings]
  );

  const forecast = useMemo(
    () => computePredictiveAnalytics(transactions, settings),
    [transactions, settings]
  );

  const handleAuthenticated = (authResult) => {
    setSession(authResult.session);
    setTransactions(authResult.entries || []);
    setSettings(authResult.settings || DEFAULT_SETTINGS);
    setSyncMode(authResult.syncMode || 'local');
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    await logoutAccount(session);
    setSession(null);
    setTransactions([]);
    setSettings(DEFAULT_SETTINGS);
    setMobileDrawerOpen(false);
    setActiveTab('dashboard');
  };

  const handleAddTransaction = async (entry) => {
    const res = await createEntry(entry, transactions, session);
    if (!res.ok) {
      return res;
    }
    setTransactions(res.entries);
    setSyncMode(res.syncMode);
    return res;
  };

  const handleDeleteTransaction = async (id) => {
    const res = await removeEntry(id, transactions, session);
    setTransactions(res.entries);
    setSyncMode(res.syncMode);
  };

  const handleUpdateSettings = async (nextSettings) => {
    const res = await updateSettingsRemote(nextSettings, session);
    if (!res.ok) {
      return res;
    }
    setSettings(res.settings);
    setSyncMode(res.syncMode);
    return res;
  };

  const handleResetAccount = async () => {
    const res = await resetAccountData(session);
    setTransactions(res.entries);
    setSettings(res.settings);
    setSyncMode(res.syncMode);
  };

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setMobileDrawerOpen(false);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center text-slate-400 text-sm">
        <div className="flex items-center gap-3 glass-card px-5 py-3.5">
          <Dumbbell className="h-5 w-5 text-emerald-400 animate-pulse" />
          <span>Loading Bulk Budget Buddy...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthGateway onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen flex bg-[#090D16] text-slate-100">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        settings={settings}
        metrics={metrics}
        syncMode={syncMode}
        user={session.user}
        onLogout={handleLogout}
      />

      {/* Mobile Top Header & Slide-over Drawer */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-[#1F2937] bg-[#0B101B]/95 backdrop-blur-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white leading-tight truncate">
                Bulk Budget Buddy
              </h1>
              <p className="text-[10px] text-slate-400 truncate">
                {session.user.name} • {syncMode === 'api' ? 'API Synced' : 'Local Mode'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileDrawerOpen((o) => !o)}
            aria-label="Toggle menu"
            className="p-2 rounded-lg text-slate-300 hover:bg-slate-800/70"
          >
            {mobileDrawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {mobileDrawerOpen && (
          <div className="md:hidden fixed inset-x-0 top-14 z-30 border-b border-[#1F2937] bg-[#0B101B]/98 backdrop-blur-xl p-4 space-y-2 shadow-2xl">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.fullLabel}</span>
                </button>
              );
            })}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{session.user.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{session.user.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold shrink-0"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-10">
          {activeTab === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              settings={settings}
              onNavigateLogger={() => handleSelectTab('logger')}
            />
          )}
          {activeTab === 'logger' && (
            <LoggerView
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsView forecast={forecast} settings={settings} />
          )}
          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onResetDemo={handleResetAccount}
              transactions={transactions}
              metrics={metrics}
              forecast={forecast}
              user={session.user}
            />
          )}
        </main>
      </div>
    </div>
  );
}
