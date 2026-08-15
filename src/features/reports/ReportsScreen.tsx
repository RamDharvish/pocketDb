import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/appStore';
import { dbManager } from '../../database/database';
import { ReportPeriod, FullReportData } from './types';
import {
  getTodayRange,
  getCurrentWeekRange,
  getCurrentMonthRange,
  getCurrentYearRange,
  formatDate,
} from '../../utils/date';
import { ReportPeriodSelector } from './components/ReportPeriodSelector';
import { ReportSummaryCards } from './components/ReportSummaryCards';
import { IncomeExpenseChart } from './components/IncomeExpenseChart';
import { ExpenseCategoryChart } from './components/ExpenseCategoryChart';
import { IncomeCategoryChart } from './components/IncomeCategoryChart';
import { AccountExpenseChart } from './components/AccountExpenseChart';
import { TopExpensesList } from './components/TopExpensesList';
import { PeriodComparisonCard } from './components/PeriodComparisonCard';
import { FinancialInsightsCard } from './components/FinancialInsightsCard';
import { DbAccount } from '../../database/queries/accountQueries';
import { BarChart3, AlertCircle, RefreshCw, Inbox, PieChart, Sparkles } from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const { profile, setActiveTab } = useAppStore();
  const currencySymbol = profile?.currencySymbol || '₹';

  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>(getCurrentMonthRange().startISO);
  const [customEndDate, setCustomEndDate] = useState<string>(getCurrentMonthRange().endISO);

  const [accounts, setAccounts] = useState<DbAccount[]>([]);
  const [reportData, setReportData] = useState<FullReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Compute active date range based on period
  const getActiveRange = useCallback(() => {
    switch (period) {
      case 'today':
        return getTodayRange();
      case 'week':
        return getCurrentWeekRange();
      case 'month':
        return getCurrentMonthRange();
      case 'year':
        return getCurrentYearRange();
      case 'custom':
      default:
        return {
          startISO: customStartDate,
          endISO: customEndDate,
          label: `${formatDate(customStartDate, 'D MMM YYYY')} - ${formatDate(customEndDate, 'D MMM YYYY')}`,
        };
    }
  }, [period, customStartDate, customEndDate]);

  // Load active accounts list
  useEffect(() => {
    dbManager.accounts
      .getAll(false)
      .then((accs) => setAccounts(accs))
      .catch((err) => console.error('Failed to load accounts for report:', err));
  }, []);

  // Fetch SQLite report data
  const loadReportData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const range = getActiveRange();
      const filter = {
        period,
        accountId: selectedAccountId,
        startDate: range.startISO,
        endDate: range.endISO,
      };

      const data = await dbManager.reports.getFullData(filter, currencySymbol);
      setReportData(data);
    } catch (err: any) {
      console.error('Failed to load report data from SQLite:', err);
      setError(err?.message || 'Failed to calculate financial analytics.');
    } finally {
      setIsLoading(false);
    }
  }, [getActiveRange, period, selectedAccountId, currencySymbol]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const activeRange = getActiveRange();
  const rangeLabel = activeRange.label;

  const hasActivity =
    reportData &&
    (reportData.summary.income > 0 ||
      reportData.summary.expenses > 0 ||
      reportData.expenseCategories.length > 0 ||
      reportData.incomeCategories.length > 0);

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto animate-in fade-in">
      {/* Page Title Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 rounded-2xl">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-gray-900 dark:text-white leading-tight font-mono">
              Analytics & Reports
            </h1>
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 font-mono">
              Deterministic SQLite Analytics
            </p>
          </div>
        </div>

        <button
          onClick={loadReportData}
          disabled={isLoading}
          className="p-2 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          title="Refresh Reports"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Period & Account Filter Controls */}
      <ReportPeriodSelector
        period={period}
        onPeriodChange={(p) => setPeriod(p)}
        selectedAccountId={selectedAccountId}
        onAccountChange={(accId) => setSelectedAccountId(accId)}
        accounts={accounts}
        startDate={activeRange.startISO}
        endDate={activeRange.endISO}
        onCustomDateChange={(s, e) => {
          setCustomStartDate(s);
          setCustomEndDate(e);
        }}
        rangeLabel={rangeLabel}
      />

      {/* Loading Skeleton View */}
      {isLoading && (
        <div className="space-y-3 py-4 animate-pulse">
          <div className="grid grid-cols-3 gap-2 h-20 bg-gray-100 dark:bg-slate-800 rounded-2xl" />
          <div className="h-44 bg-gray-100 dark:bg-slate-800 rounded-2xl" />
          <div className="h-44 bg-gray-100 dark:bg-slate-800 rounded-2xl" />
        </div>
      )}

      {/* Error View */}
      {!isLoading && error && (
        <div className="bg-red-50 dark:bg-red-950/50 p-5 rounded-2xl border border-red-200 dark:border-red-900/60 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-xs font-bold text-red-800 dark:text-red-300 font-mono">{error}</p>
          <button
            onClick={loadReportData}
            className="px-4 py-2 bg-red-600 text-white font-bold font-mono text-xs rounded-xl shadow-xs hover:bg-red-700 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty View (Task 11 Spec) */}
      {!isLoading && !error && !hasActivity && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 text-center space-y-3 shadow-2xs">
          <div className="inline-flex p-3.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl">
            <PieChart className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-white font-mono">
            Nothing to analyze yet
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            Add transactions to unlock your financial insights and spending breakdowns for ({rangeLabel}).
          </p>
          <div className="pt-2">
            <button
              onClick={() => setActiveTab('transactions')}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold rounded-xl shadow-md cursor-pointer transition-all"
            >
              Go to Ledger
            </button>
          </div>
        </div>
      )}

      {/* Report Dashboard Cards */}
      {!isLoading && !error && reportData && (
        <div className="space-y-4">
          {/* Summary Metrics */}
          <ReportSummaryCards summary={reportData.summary} currencySymbol={currencySymbol} />

          {/* Income vs Expenses Trend Chart */}
          <IncomeExpenseChart data={reportData.trendPoints} currencySymbol={currencySymbol} />

          {/* Expense Category Breakdown */}
          <ExpenseCategoryChart categories={reportData.expenseCategories} currencySymbol={currencySymbol} />

          {/* Income Sources Category Breakdown */}
          <IncomeCategoryChart categories={reportData.incomeCategories} currencySymbol={currencySymbol} />

          {/* Account-wise Spending Breakdown */}
          <AccountExpenseChart
            accounts={reportData.accountBreakdown}
            selectedAccountId={selectedAccountId}
            onSelectAccount={(accId) => setSelectedAccountId(accId)}
            currencySymbol={currencySymbol}
          />

          {/* Top 5 Individual Expenses */}
          <TopExpensesList expenses={reportData.topExpenses} currencySymbol={currencySymbol} />

          {/* Period Comparison (MoM / YoY) */}
          <PeriodComparisonCard
            monthComparison={reportData.monthComparison}
            yearComparison={reportData.yearComparison}
            currencySymbol={currencySymbol}
          />

          {/* Rule-based Financial Insights */}
          <FinancialInsightsCard insights={reportData.insights} />
        </div>
      )}
    </div>
  );
};
