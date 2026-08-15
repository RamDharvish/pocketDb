import React from 'react';
import { formatCurrency } from '../../../utils/currency';
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';

interface SummaryCardProps {
  income: number;
  expenses: number;
  net: number;
  currencySymbol: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ income, expenses, net, currencySymbol }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-2xs grid grid-cols-3 gap-2 text-center">
      {/* Income */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
          <TrendingUp className="w-3 h-3" />
          <span>Income</span>
        </span>
        <p className="text-xs sm:text-sm font-black text-gray-900 dark:text-white truncate">
          {formatCurrency(income, currencySymbol)}
        </p>
      </div>

      {/* Expenses */}
      <div className="space-y-1 border-x border-gray-100 dark:border-gray-700 px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
          <TrendingDown className="w-3 h-3" />
          <span>Expenses</span>
        </span>
        <p className="text-xs sm:text-sm font-black text-gray-900 dark:text-white truncate">
          {formatCurrency(expenses, currencySymbol)}
        </p>
      </div>

      {/* Net */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
          <Scale className="w-3 h-3" />
          <span>Net</span>
        </span>
        <p
          className={`text-xs sm:text-sm font-black truncate ${
            net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
          }`}
        >
          {formatCurrency(net, currencySymbol)}
        </p>
      </div>
    </div>
  );
};
