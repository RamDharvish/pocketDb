import React from 'react';
import { MonthComparison, YearComparison } from '../types';
import { formatCurrency } from '../../../utils/currency';
import { TrendingUp, TrendingDown, Calendar, Percent } from 'lucide-react';

interface PeriodComparisonCardProps {
  monthComparison?: MonthComparison | null;
  yearComparison?: YearComparison | null;
  currencySymbol?: string;
}

export const PeriodComparisonCard: React.FC<PeriodComparisonCardProps> = ({
  monthComparison,
  yearComparison,
  currencySymbol = '₹',
}) => {
  if (!monthComparison && !yearComparison) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/80 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
          <Percent className="w-4 h-4 text-purple-500" /> Period Comparison
        </h3>
        <span className="text-[10px] font-semibold text-gray-400">
          {monthComparison ? 'Month-over-Month' : 'Year-over-Year'}
        </span>
      </div>

      {monthComparison && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Expense Comparison */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl space-y-1">
            <p className="text-[10px] uppercase font-bold text-gray-400">Expenses vs Prev Month</p>
            <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
              {formatCurrency(monthComparison.currentMonthExpenses, currencySymbol)}
            </p>
            {monthComparison.expenseDiffPct !== null ? (
              <div
                className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                  monthComparison.expenseDiffPct <= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {monthComparison.expenseDiffPct <= 0 ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5" />
                )}
                <span>
                  {Math.abs(monthComparison.expenseDiffPct)}% {monthComparison.expenseDiffPct <= 0 ? 'lower' : 'higher'}
                </span>
              </div>
            ) : (
              <p className="text-[10px] text-gray-400 font-medium">No previous month data</p>
            )}
          </div>

          {/* Income Comparison */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl space-y-1">
            <p className="text-[10px] uppercase font-bold text-gray-400">Income vs Prev Month</p>
            <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
              {formatCurrency(monthComparison.currentMonthIncome, currencySymbol)}
            </p>
            {monthComparison.incomeDiffPct !== null ? (
              <div
                className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                  monthComparison.incomeDiffPct >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {monthComparison.incomeDiffPct >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>
                  {Math.abs(monthComparison.incomeDiffPct)}% {monthComparison.incomeDiffPct >= 0 ? 'higher' : 'lower'}
                </span>
              </div>
            ) : (
              <p className="text-[10px] text-gray-400 font-medium">No previous month data</p>
            )}
          </div>
        </div>
      )}

      {yearComparison && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Yearly Expense Comparison */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl space-y-1">
            <p className="text-[10px] uppercase font-bold text-gray-400">Yearly Expenses</p>
            <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
              {formatCurrency(yearComparison.currentYearExpenses, currencySymbol)}
            </p>
            {yearComparison.expenseDiffPct !== null ? (
              <div
                className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                  yearComparison.expenseDiffPct <= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {yearComparison.expenseDiffPct <= 0 ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5" />
                )}
                <span>
                  {Math.abs(yearComparison.expenseDiffPct)}% {yearComparison.expenseDiffPct <= 0 ? 'lower YoY' : 'higher YoY'}
                </span>
              </div>
            ) : (
              <p className="text-[10px] text-gray-400 font-medium">No previous year data</p>
            )}
          </div>

          {/* Yearly Income Comparison */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl space-y-1">
            <p className="text-[10px] uppercase font-bold text-gray-400">Yearly Income</p>
            <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
              {formatCurrency(yearComparison.currentYearIncome, currencySymbol)}
            </p>
            {yearComparison.incomeDiffPct !== null ? (
              <div
                className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                  yearComparison.incomeDiffPct >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {yearComparison.incomeDiffPct >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>
                  {Math.abs(yearComparison.incomeDiffPct)}% {yearComparison.incomeDiffPct >= 0 ? 'higher YoY' : 'lower YoY'}
                </span>
              </div>
            ) : (
              <p className="text-[10px] text-gray-400 font-medium">No previous year data</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
