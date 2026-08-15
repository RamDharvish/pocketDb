import React from 'react';
import { AccountSpendingSummary } from '../../../database/queries/transactionQueries';
import { formatCurrency } from '../../../utils/currency';
import { Landmark, Wallet, Banknote, CreditCard, Coins, PieChart } from 'lucide-react';

interface AccountSpendingCardProps {
  accountExpenses: AccountSpendingSummary[];
  currencySymbol: string;
}

export const AccountSpendingCard: React.FC<AccountSpendingCardProps> = ({ accountExpenses, currencySymbol }) => {
  if (accountExpenses.length === 0) return null;

  const getAccountIconComponent = (type: string, className = 'w-4 h-4') => {
    switch (type) {
      case 'bank':
        return <Landmark className={`${className} text-blue-500`} />;
      case 'cash':
        return <Banknote className={`${className} text-emerald-500`} />;
      case 'credit_card':
        return <CreditCard className={`${className} text-purple-500`} />;
      case 'wallet':
        return <Wallet className={`${className} text-amber-500`} />;
      default:
        return <Coins className={`${className} text-indigo-500`} />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
          <PieChart className="w-4 h-4 text-indigo-500" />
          <span>Spending by Account</span>
        </h3>
      </div>

      <div className="space-y-2">
        {accountExpenses.map((acc, idx) => (
          <div
            key={acc.accountId || `acc_exp_${idx}_${acc.accountName || 'acc'}`}
            className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/60 rounded-2xl"
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="p-2 bg-white dark:bg-gray-700 rounded-xl shadow-2xs shrink-0">
                {getAccountIconComponent(acc.accountType)}
              </div>
              <span className="text-xs font-extrabold text-gray-900 dark:text-white truncate">{acc.accountName}</span>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-black text-red-600 dark:text-red-400">
                {formatCurrency(acc.totalAmount, currencySymbol)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
