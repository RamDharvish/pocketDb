import React, { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import { Header } from './components/ui/Header';
import { BottomNavigation } from './components/ui/BottomNavigation';
import { OnboardingView } from './components/ui/OnboardingView';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { TransactionsScreen } from './features/transactions/TransactionsScreen';
import { AccountsScreen } from './features/accounts/AccountsScreen';
import { ReportsScreen } from './features/reports/ReportsScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';

export default function App() {
  const { isInitialized, initApp, profile, activeTab, settings } = useAppStore();

  useEffect(() => {
    initApp();
  }, [initApp]);

  useEffect(() => {
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (settings.theme === 'system' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono font-bold text-gray-500 dark:text-slate-400">Initializing PocketDB Ledger...</p>
        </div>
      </div>
    );
  }

  // If user hasn't onboarded, display onboarding
  if (!profile || !profile.isOnboarded) {
    return <OnboardingView />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'transactions':
        return <TransactionsScreen />;
      case 'accounts':
        return <AccountsScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans ${settings.theme === 'dark' ? 'dark' : ''}`}>
      <Header />
      <main className="max-w-md mx-auto px-4 pt-4">
        {renderActiveTab()}
      </main>
      <BottomNavigation />
    </div>
  );
}
