import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CategoryReportItem } from '../types';
import { formatCurrency, toMajorUnits } from '../../../utils/currency';
import { ArrowDownLeft } from 'lucide-react';

interface IncomeCategoryChartProps {
  categories: CategoryReportItem[];
  currencySymbol?: string;
}

const INCOME_COLORS = ['#10B981', '#059669', '#3B82F6', '#6366F1', '#8B5CF6', '#14B8A6'];

export const IncomeCategoryChart: React.FC<IncomeCategoryChartProps> = ({
  categories,
  currencySymbol = '₹',
}) => {
  if (!categories || categories.length === 0) {
    return null; // Don't clutter UI if there's no income sources in period
  }

  const chartData = categories.map((c, idx) => ({
    name: c.categoryName,
    value: toMajorUnits(c.amount),
    amountMinor: c.amount,
    percentage: c.percentage,
    color: c.categoryColor || INCOME_COLORS[idx % INCOME_COLORS.length],
  }));

  const totalIncome = categories.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/80 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
          <ArrowDownLeft className="w-4 h-4 text-emerald-500" /> Income Sources
        </h3>
        <span className="text-[10px] font-semibold text-gray-400">
          Total: {formatCurrency(totalIncome, currencySymbol)}
        </span>
      </div>

      <div className="space-y-2.5">
        {categories.map((cat, idx) => {
          const color = cat.categoryColor || INCOME_COLORS[idx % INCOME_COLORS.length];
          return (
            <div key={`inc_cat_${cat.categoryId || 'cat'}_${idx}`} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{cat.categoryName}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(cat.amount, currencySymbol)}
                  </span>
                  <span className="text-[10px] text-gray-400 ml-1.5 font-medium">({cat.percentage}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(2, cat.percentage))}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
