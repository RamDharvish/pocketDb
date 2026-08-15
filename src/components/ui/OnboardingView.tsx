import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../../store/appStore';
import { SUPPORTED_CURRENCIES, ACCOUNT_TYPE_LABELS } from '../../constants';
import { AccountType, CurrencyCode } from '../../types';
import { parseCurrencyInput } from '../../utils/currency';
import { PocketDbLogo } from './PocketDbLogo';
import {
  ShieldCheck,
  Terminal,
  Database,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  HardDrive,
  Cpu,
  Lock,
  User,
  Sparkles,
  Layers,
  FileCode,
} from 'lucide-react';

export const OnboardingView: React.FC = () => {
  const { setOnboarding } = useAppStore();

  // Slide / Stage State: 0, 1, 2 = Value Props; 3 = Profile; 4 = Initial Account
  const [slideIndex, setSlideIndex] = useState<number>(0);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [accountName, setAccountName] = useState('Main Bank');
  const [accountType, setAccountType] = useState<AccountType>('bank');
  const [openingBalanceStr, setOpeningBalanceStr] = useState('10000');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const valueProps = [
    {
      title: 'PRIVATE BY DESIGN',
      subtitle: 'Your financial data stays on your device.',
      description:
        'PocketDB runs an embedded SQLite database locally on this machine. No cloud databases, no tracking, and no third-party financial scraping.',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
      badge: '100% OFFLINE',
      badgeBg: 'bg-emerald-950/80 border-emerald-800 text-emerald-300',
    },
    {
      title: 'BUILT FOR DEVELOPERS',
      subtitle: 'Manual control. Structured data. No unnecessary cloud services.',
      description:
        'Designed for engineers who value schema discipline. Every transaction, transfer, and account balance is deterministic and verifiable.',
      icon: Terminal,
      iconColor: 'text-cyan-400',
      badge: 'SCHEMA FIRST',
      badgeBg: 'bg-cyan-950/80 border-cyan-800 text-cyan-300',
    },
    {
      title: 'YOUR DATABASE',
      subtitle: 'Track, analyze, export and restore your financial data whenever you want.',
      description:
        'Full data portability with standard JSON exports and imports. You own the raw database and can inspect or back it up anytime.',
      icon: Database,
      iconColor: 'text-indigo-400',
      badge: 'JSON BACKUP',
      badgeBg: 'bg-indigo-950/80 border-indigo-800 text-indigo-300',
    },
  ];

  const handleNextSlide = () => {
    if (slideIndex < 2) {
      setSlideIndex((prev) => prev + 1);
    } else {
      setSlideIndex(3); // Go to Profile Setup
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required and cannot be empty.');
      return;
    }
    setError('');
    setSlideIndex(4); // Go to Account Setup
  };

  const handleAccountComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedAcc = accountName.trim();
    if (!trimmedAcc) {
      setError('Account name is required.');
      return;
    }

    const paise = parseCurrencyInput(openingBalanceStr);
    if (isNaN(paise)) {
      setError('Please enter a valid numeric opening balance.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await setOnboarding(name.trim(), currency, trimmedAcc, accountType, paise);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete setup. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Tech Grids */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(37,99,235,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-30" />

      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800 p-6 sm:p-8 space-y-6 relative z-10">
        {/* Header Branding Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <PocketDbLogo size="sm" variant="with-wordmark" />
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
            <span>{slideIndex <= 2 ? `Intro ${slideIndex + 1}/3` : slideIndex === 3 ? 'Profile' : 'Ledger'}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3, 4].map((stepIdx) => (
            <div
              key={stepIdx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                stepIdx === slideIndex
                  ? 'flex-1 bg-blue-500'
                  : stepIdx < slideIndex
                  ? 'w-4 bg-blue-800'
                  : 'w-2 bg-slate-800'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 text-red-300 text-xs rounded-xl font-medium border border-red-800/80 animate-in fade-in">
            {error}
          </div>
        )}

        {/* --- STAGE 0, 1, 2: VALUE PROPOSITION SLIDES --- */}
        {slideIndex <= 2 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`slide-${slideIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 text-center"
            >
              {/* Feature Hero Icon / Graphic */}
              <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-md" />
                <div className="w-20 h-20 bg-slate-800/80 border border-slate-700/80 rounded-2xl flex items-center justify-center relative">
                  {React.createElement(valueProps[slideIndex].icon, {
                    className: `w-9 h-9 ${valueProps[slideIndex].iconColor}`,
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold border mb-1"
                  style={{
                    backgroundColor: slideIndex === 0 ? '#064E3B' : slideIndex === 1 ? '#083344' : '#1E1B4B',
                    color: slideIndex === 0 ? '#6EE7B7' : slideIndex === 1 ? '#67E8F9' : '#A5B4FC',
                    borderColor: slideIndex === 0 ? '#059669' : slideIndex === 1 ? '#0891B2' : '#4F46E5',
                  }}
                >
                  <span>{valueProps[slideIndex].badge}</span>
                </div>
                <h2 className="text-xl font-black tracking-tight text-white font-mono">
                  {valueProps[slideIndex].title}
                </h2>
                <p className="text-sm font-semibold text-blue-300">
                  {valueProps[slideIndex].subtitle}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  {valueProps[slideIndex].description}
                </p>
              </div>

              {/* Developer Feature Node Specs */}
              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-left font-mono text-[11px] space-y-1.5 text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Engine:</span>
                  <span className="text-slate-200">SQLite 3 (Embedded)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ledger Model:</span>
                  <span className="text-emerald-400">Deterministic Integer (Paise)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Remote Connectivity:</span>
                  <span className="text-cyan-400">None (100% Air-Gapped)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {slideIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSlideIndex((prev) => prev - 1)}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSlideIndex(3)}
                    className="py-3 px-4 text-slate-500 hover:text-slate-300 font-mono text-xs font-medium transition-colors cursor-pointer"
                  >
                    Skip Intro
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNextSlide}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{slideIndex === 2 ? 'Set Up Profile' : 'Next'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* --- STAGE 3: USER PROFILE SETUP --- */}
        {slideIndex === 3 && (
          <form onSubmit={handleProfileSubmit} className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-400 uppercase tracking-wider">
                <User className="w-3 h-3" />
                <span>Identity Configuration</span>
              </div>
              <h3 className="text-lg font-black text-white font-mono">User Profile</h3>
              <p className="text-xs text-slate-400">Define your local ledger name and primary display currency.</p>
            </div>

            <div className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Developer / Profile Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Alex Chen"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError('');
                    }}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium font-mono"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Base Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono cursor-pointer"
                >
                  {SUPPORTED_CURRENCIES.map((curr) => (
                    <option key={curr.code} value={curr.code} className="bg-slate-900 text-white">
                      {curr.symbol} — {curr.name} ({curr.code})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  Stored with exact minor integer arithmetic.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setSlideIndex(2)}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Continue to First Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* --- STAGE 4: INITIAL ACCOUNT SETUP --- */}
        {slideIndex === 4 && (
          <form onSubmit={handleAccountComplete} className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                <HardDrive className="w-3 h-3" />
                <span>Initial Ledger Account</span>
              </div>
              <h3 className="text-lg font-black text-white font-mono">Create Primary Account</h3>
              <p className="text-xs text-slate-400">Initialize your first bank account, cash wallet, or credit ledger.</p>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Account Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main Bank, ICICI Salary, Cash"
                  value={accountName}
                  onChange={(e) => {
                    setAccountName(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Account Type
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as AccountType)}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono cursor-pointer"
                >
                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key} className="bg-slate-900 text-white">
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Opening Balance ({currency})
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={openingBalanceStr}
                  onChange={(e) => setOpeningBalanceStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-medium"
                />
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  Deterministic baseline balance before transactions are logged.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setSlideIndex(3)}
                disabled={isSubmitting}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Initializing SQLite...</span>
                ) : (
                  <>
                    <span>Initialize PocketDB</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Security & Privacy Specs Footer */}
        <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-800">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            100% Local SQLite
          </span>
          <span className="flex items-center gap-1">
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            JSON Schema v1
          </span>
        </div>
      </div>
    </div>
  );
};
