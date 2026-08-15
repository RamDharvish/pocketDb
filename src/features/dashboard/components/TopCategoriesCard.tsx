import React from 'react';
import { CategorySpendingSummary } from '../../../database/queries/transactionQueries';
import { formatCurrency } from '../../../utils/currency';
import { CategoryIcon } from '../../../components/ui/CategoryIcon';
import { Tag } from 'lucide-react';

interface TopCategoriesCardProps {
  categories: CategorySpendingSummary[];
  totalPeriodExpenses: number;
  currencySymbol: string;
}

export const TopCategoriesCard: React.FC<TopCategoriesCardProps> = ({
  categories,
  totalPeriodExpenses,
  currencySymbol,
}) => {
  if (categories.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-amber-500" />
          <span>Top Expense Categories</span>
        </h3>
        <span className="text-[10px] text-gray-400 font-semibold">Top {categories.length}</span>
      </div>

      <div className="space-y-3">
        {categories.map((cat, idx) => {
          const pct = totalPeriodExpenses > 0 ? Math.min(100, Math.round((cat.totalAmount / totalPeriodExpenses) * 100)) : 0;

          return (
            <div key={cat.categoryId || `top_cat_${idx}_${cat.categoryName || 'item'}`} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat.categoryColor || '#3B82F6'}20` }}
                  >
                    <CategoryIcon
                      name={cat.categoryIcon || 'Tag'}
                      color={cat.categoryColor || '#3B82F6'}
                      className="w-3.5 h-3.5"
                    />
                  </div>
                  <span className="font-extrabold text-gray-900 dark:text-white truncate">{cat.categoryName}</span>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-black text-gray-900 dark:text-white">
                    {formatCurrency(cat.totalAmount, currencySymbol)}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 ml-1.5">({pct}%)</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: cat.categoryColor || '#3B82F6',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
