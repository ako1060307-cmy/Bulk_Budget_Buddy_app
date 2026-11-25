import React, { useState } from 'react';
import {
  Dumbbell,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Wallet,
  Flame,
  Beef,
} from 'lucide-react';
import { loginAccount, registerAccount } from '../services/api';

export default function AuthGateway({ onAuthenticated }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sign In fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Create Account fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('8000');
  const [calorieGoal, setCalorieGoal] = useState('3300');
  const [proteinGoal, setProteinGoal] = useState('140');

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginAccount({ email: loginEmail, password: loginPassword });
      if (!res.ok) {
        setError(res.error || 'Invalid email or password.');
        return;
      }
      onAuthenticated(res);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await registerAccount({
        name: regName,
        email: regEmail,
        password: regPassword,
        monthlyBudget: Number(monthlyBudget),
        calorieGoal: Number(calorieGoal),
        proteinGoal: Number(proteinGoal),
      });
      if (!res.ok) {
        setError(res.error || 'Could not create account.');
        return;
      }
      onAuthenticated(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Subtle Ambient Glows */}
      <div className="pointer-events-none absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="w-full max-w-[480px] relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/35 shadow-glowEmerald mb-3.5">
            <Dumbbell className="h-7 w-7 text-emerald-400" />
            <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-[#090D16]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Bulk Budget Buddy
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Automated Personal Expense &amp; &ldquo;Clean Bulk&rdquo; Nutrition Tracker
          </p>
        </div>

        {/* Glass-Bordered Auth Card */}
        <div className="glass-card p-6 sm:p-7 border border-[#1F2937]">
          {/* Segmented Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#090D16] border border-[#1F2937] mb-6">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                mode === 'signin'
                  ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/15 text-emerald-300 border border-emerald-500/35 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/15 text-emerald-300 border border-emerald-500/35 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/35 px-3.5 py-2.5 flex items-start gap-2.5 text-xs text-rose-200">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ayush@college.edu"
                    className="w-full rounded-xl bg-[#090D16] border border-[#1F2937] focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl bg-[#090D16] border border-[#1F2937] focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-semibold text-sm shadow-glowEmerald hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition-all"
              >
                <span>{loading ? 'Signing In...' : 'Sign In to Dashboard'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="text-center text-xs text-slate-400 pt-1">
                New here?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-emerald-400 font-semibold hover:text-emerald-300"
                >
                  Create a fresh ₹0 account
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ayush Kumar Ojha"
                    className="w-full rounded-xl bg-[#090D16] border border-[#1F2937] focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="you@college.edu"
                      className="w-full rounded-xl bg-[#090D16] border border-[#1F2937] focus:border-emerald-500/60 pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full rounded-xl bg-[#090D16] border border-[#1F2937] focus:border-emerald-500/60 pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Initial Clean Bulk &amp; Budget Targets
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="flex items-center gap-1 text-[11px] font-medium text-slate-300 mb-1">
                      <Wallet className="h-3 w-3 text-cyan-400" />
                      Budget (₹)
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      required
                      value={monthlyBudget}
                      onChange={(e) => setMonthlyBudget(e.target.value)}
                      className="w-full rounded-xl bg-[#090D16] border border-[#1F2937] focus:border-cyan-500/60 px-2.5 py-2 text-xs sm:text-sm font-mono font-semibold text-white tabular-inr outline-none"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-[11px] font-medium text-slate-300 mb-1">
                      <Flame className="h-3 w-3 text-emerald-400" />
                      Calories
                    </label>
                    <input
                      type="number"
                      min="500"
                      step="50"
                      required
                      value={calorieGoal}
                      onChange={(e) => setCalorieGoal(e.target.value)}
                      className="w-full rounded-xl bg-[#090D16] border border-[#1F2937] focus:border-emerald-500/60 px-2.5 py-2 text-xs sm:text-sm font-mono font-semibold text-white tabular-inr outline-none"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-[11px] font-medium text-slate-300 mb-1">
                      <Beef className="h-3 w-3 text-cyan-400" />
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      min="10"
                      step="5"
                      required
                      value={proteinGoal}
                      onChange={(e) => setProteinGoal(e.target.value)}
                      className="w-full rounded-xl bg-[#090D16] border border-[#1F2937] focus:border-cyan-500/60 px-2.5 py-2 text-xs sm:text-sm font-mono font-semibold text-white tabular-inr outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 flex items-center gap-2 text-[11px] text-emerald-200">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Starts cleanly at ₹0 spent, 0 kcal &amp; 0g protein — isolated to your account.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-semibold text-sm shadow-glowEmerald hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition-all"
              >
                <span>{loading ? 'Creating Profile...' : 'Create Account & Start'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-5">
          Built by <span className="text-slate-300 font-medium">Ayush Kumar Ojha</span> • CSD First Year • Roll No. BTCD26O1039
        </p>
      </div>
    </div>
  );
}
