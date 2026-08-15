import React from 'react';
import { TopExpenseItem } from '../types';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/date';
import { Flame, ArrowUpRight } from 'lucide-react';

interface TopExpensesListProps {
  expenses: TopExpenseItem[];
  currencySymbol?: string;
  onItemClick?: (id: string) => void;
}

export const TopExpensesList: React.FC<TopExpensesListProps> = ({
  expenses,
  currencySymbol = '₹',
  onItemClick,
}) => {
  if (!expenses || expenses.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/80 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-orange-500" /> Top Individual Expenses
        </h3>
        <span className="text-[10px] font-semibold text-gray-400">Largest transactions</span>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
        {expenses.map((item, idx) => (
          <div
            key={`top_exp_${item.id || 'item'}_${idx}`}
            onClick={() => onItemClick && onItemClick(item.id)}
            className={`py-2.5 flex items-center justify-between text-xs transition-colors ${
              onItemClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40 rounded-lg px-1' : ''
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="p-2 rounded-xl shrink-0"
                style={{
                  backgroundColor: `${item.categoryColor}20`,
                  color: item.categoryColor,
                }}
              >
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-800 dark:text-gray-200 truncate">
                  {item.note || item.categoryName}
                </p>
                <p className="text-[10px] text-gray-400 font-medium truncate">
                  {item.categoryName} &bull; {item.accountName} &bull; {formatDate(item.date, 'D MMM YYYY')}
                </p>
              </div>
            </div>

            <span className="font-extrabold text-red-600 dark:text-red-400 shrink-0 ml-2">
              -{formatCurrency(item.amount, currencySymbol)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
