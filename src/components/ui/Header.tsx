import React from 'react';
import { useAppStore } from '../../store/appStore';
import { AccountSelector } from './AccountSelector';
import { PocketDbLogo } from './PocketDbLogo';
import { Moon, Sun, Monitor, ShieldCheck, Database } from 'lucide-react';

export const Header: React.FC = () => {
  const { profile, accounts, activeTab, settings, updateSettings } = useAppStore();

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'PocketDB Dashboard';
      case 'transactions':
        return 'Ledger & Transactions';
      case 'accounts':
        return 'Financial Accounts';
      case 'reports':
        return 'Analytics & Reports';
      case 'settings':
        return 'System & Settings';
      default:
        return 'PocketDB';
    }
  };

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'light' ? 'dark' : settings.theme === 'dark' ? 'system' : 'light';
    updateSettings({ theme: nextTheme });
  };

  return (
    <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200/80 dark:border-slate-800 px-4 py-2.5 sticky top-0 z-30 shadow-xs transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Brand & Context */}
        <div className="flex items-center gap-2.5 min-w-0">
          <PocketDbLogo size="sm" variant="icon-only" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 leading-none">
              <h1 className="text-sm font-black text-gray-900 dark:text-white tracking-tight truncate font-mono">
                {getTitle()}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-2.5 h-2.5" />
                LOCAL
              </span>
            </div>
            {profile && (
              <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium truncate mt-0.5">
                {profile.name} <span className="text-gray-400 dark:text-slate-600">•</span>{' '}
                <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                  {accounts.length} acc{accounts.length === 1 ? '' : 's'}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Right Action Bar: Account Switcher & Theme Toggle */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {activeTab !== 'settings' && accounts.length > 0 && <AccountSelector />}

          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title={`Theme: ${settings.theme} (Click to switch)`}
            aria-label="Toggle theme"
          >
            {settings.theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : settings.theme === 'dark' ? (
              <Moon className="w-4 h-4 text-blue-400" />
            ) : (
              <Monitor className="w-4 h-4 text-gray-400 dark:text-slate-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
