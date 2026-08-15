import React from 'react';
import { AccountReportItem } from '../types';
import { formatCurrency } from '../../../utils/currency';
import { Wallet, ChevronRight } from 'lucide-react';

interface AccountExpenseChartProps {
  accounts: AccountReportItem[];
  selectedAccountId: string;
  onSelectAccount: (accountId: string) => void;
  currencySymbol?: string;
}

export const AccountExpenseChart: React.FC<AccountExpenseChartProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  currencySymbol = '₹',
}) => {
  if (!accounts || accounts.length === 0) {
    return null;
  }

  const maxExpense = Math.max(...accounts.map((a) => a.expenses), 1);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/80 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
          <Wallet className="w-4 h-4 text-indigo-500" /> Account-wise Spending
        </h3>
        <span className="text-[10px] font-semibold text-gray-400">Tap account to filter</span>
      </div>

      <div className="space-y-2.5">
        {accounts.map((acc, idx) => {
          const isSelected = selectedAccountId === acc.accountId;
          const pct = Math.round((acc.expenses / maxExpense) * 100);

          return (
            <button
              key={`acc_exp_${acc.accountId || 'acc'}_${idx}`}
              type="button"
              onClick={() => onSelectAccount(isSelected ? 'ALL' : acc.accountId)}
              className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                isSelected
                  ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 shadow-2xs'
                  : 'bg-gray-50/60 dark:bg-gray-900/40 border-gray-100 dark:border-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700/60'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: acc.accountColor || '#3B82F6' }}
                  />
                  <span className="font-bold text-gray-800 dark:text-gray-200">{acc.accountName}</span>
                  <span className="text-[10px] text-gray-400 capitalize">({acc.accountType})</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-gray-900 dark:text-gray-100">
                    {formatCurrency(acc.expenses, currencySymbol)}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>

              {/* Relative Expense Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(4, pct)}%`,
                    backgroundColor: acc.accountColor || '#3B82F6',
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
