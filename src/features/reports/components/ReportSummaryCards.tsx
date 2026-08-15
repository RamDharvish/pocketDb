import React from 'react';
import { ReportSummary } from '../types';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';
import { ArrowDownLeft, ArrowUpRight, Scale, PiggyBank, CalendarDays, Flame } from 'lucide-react';

interface ReportSummaryCardsProps {
  summary: ReportSummary;
  currencySymbol?: string;
}

export const ReportSummaryCards: React.FC<ReportSummaryCardsProps> = ({ summary, currencySymbol = '₹' }) => {
  return (
    <div className="space-y-3">
      {/* Primary Metrics Row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Income Card */}
        <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 space-y-1">
          <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Income</span>
          </div>
          <p className="text-base sm:text-lg font-black text-emerald-800 dark:text-emerald-300 truncate">
            {formatCurrency(summary.income, currencySymbol)}
          </p>
        </div>

        {/* Expenses Card */}
        <div className="bg-red-50/80 dark:bg-red-950/40 p-3 rounded-2xl border border-red-100 dark:border-red-900/50 space-y-1">
          <div className="flex items-center gap-1 text-red-700 dark:text-red-400 font-semibold text-[11px] uppercase tracking-wider">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Expenses</span>
          </div>
          <p className="text-base sm:text-lg font-black text-red-800 dark:text-red-300 truncate">
            {formatCurrency(summary.expenses, currencySymbol)}
          </p>
        </div>

        {/* Net Cash Flow Card */}
        <div className={`p-3 rounded-2xl border space-y-1 ${
          summary.net >= 0
            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/50'
            : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50'
        }`}>
          <div className={`flex items-center gap-1 font-semibold text-[11px] uppercase tracking-wider ${
            summary.net >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-amber-700 dark:text-amber-400'
          }`}>
            <Scale className="w-3.5 h-3.5" />
            <span>Net Flow</span>
          </div>
          <p className={`text-base sm:text-lg font-black truncate ${
            summary.net >= 0 ? 'text-blue-800 dark:text-blue-300' : 'text-amber-800 dark:text-amber-300'
          }`}>
            {formatCurrency(summary.net, currencySymbol)}
          </p>
        </div>
      </div>

      {/* Secondary Financial Metrics Bar */}
      <div className="grid grid-cols-3 gap-2 bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-2xs">
        {/* Savings Rate */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-tight">
            <PiggyBank className="w-3 h-3 text-purple-500" />
            <span>Savings Rate</span>
          </div>
          <p className="text-xs font-extrabold text-gray-900 dark:text-gray-100">
            {summary.savingsRate !== null ? `${summary.savingsRate}%` : 'N/A'}
          </p>
        </div>

        {/* Daily Avg */}
        <div className="space-y-0.5 border-l border-gray-100 dark:border-gray-700/80 pl-2">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-tight">
            <CalendarDays className="w-3 h-3 text-blue-500" />
            <span>Daily Avg</span>
          </div>
          <p className="text-xs font-extrabold text-gray-900 dark:text-gray-100 truncate">
            {formatCurrency(summary.avgDailyExpense, currencySymbol)}
          </p>
        </div>

        {/* Peak Spend Day */}
        <div className="space-y-0.5 border-l border-gray-100 dark:border-gray-700/80 pl-2">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-tight">
            <Flame className="w-3 h-3 text-orange-500" />
            <span>Peak Day</span>
          </div>
          <p className="text-xs font-extrabold text-gray-900 dark:text-gray-100 truncate">
            {summary.highestSpendingDay
              ? `${formatDate(summary.highestSpendingDay.date, 'D MMM')} (${formatCurrency(summary.highestSpendingDay.amount, currencySymbol)})`
              : 'None'}
          </p>
        </div>
      </div>
    </div>
  );
};
