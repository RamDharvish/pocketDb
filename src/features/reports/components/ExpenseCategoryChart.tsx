import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CategoryReportItem } from '../types';
import { formatCurrency, toMajorUnits } from '../../../utils/currency';
import { PieChart as PieIcon, Tag } from 'lucide-react';

interface ExpenseCategoryChartProps {
  categories: CategoryReportItem[];
  currencySymbol?: string;
  title?: string;
}

const DEFAULT_COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899', '#6B7280'];

export const ExpenseCategoryChart: React.FC<ExpenseCategoryChartProps> = ({
  categories,
  currencySymbol = '₹',
  title = 'Expense Category Breakdown',
}) => {
  if (!categories || categories.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/80 space-y-2 text-center">
        <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center justify-center gap-1.5">
          <PieIcon className="w-4 h-4 text-rose-500" /> {title}
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 py-6">
          No spending categories in this period.
        </p>
      </div>
    );
  }

  // Limit pie chart segments to top 5 + "Other" to prevent tiny unreadable clutter
  let displayCategories = [...categories];
  if (categories.length > 5) {
    const top4 = categories.slice(0, 4);
    const rest = categories.slice(4);
    const otherAmount = rest.reduce((sum, c) => sum + c.amount, 0);
    const totalAmount = categories.reduce((sum, c) => sum + c.amount, 0);
    const otherPct = totalAmount > 0 ? Math.round((otherAmount / totalAmount) * 10000) / 100 : 0;

    displayCategories = [
      ...top4,
      {
        categoryId: 'cat_other',
        categoryName: 'Other',
        categoryIcon: 'MoreHorizontal',
        categoryColor: '#6B7280',
        amount: otherAmount,
        percentage: otherPct,
      },
    ];
  }

  const chartData = displayCategories.map((c, idx) => ({
    name: c.categoryName,
    value: toMajorUnits(c.amount),
    amountMinor: c.amount,
    percentage: c.percentage,
    color: c.categoryColor || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
  }));

  const totalExpense = categories.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/80 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
          <PieIcon className="w-4 h-4 text-rose-500" /> {title}
        </h3>
        <span className="text-[10px] font-semibold text-gray-400">
          Total: {formatCurrency(totalExpense, currencySymbol)}
        </span>
      </div>

      {/* Donut Chart */}
      <div className="h-44 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              paddingAngle={3}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: any, name: any, item: any) => [
                `${formatCurrency(item.payload.amountMinor, currencySymbol)} (${item.payload.percentage}%)`,
                name,
              ]}
              contentStyle={{
                backgroundColor: '#1F2937',
                borderColor: '#374151',
                borderRadius: '0.75rem',
                fontSize: '11px',
                color: '#F9FAFB',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center Text in Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase font-bold text-gray-400">Categories</span>
          <span className="text-sm font-black text-gray-800 dark:text-gray-100">{categories.length}</span>
        </div>
      </div>

      {/* Category List with Progress Bars */}
      <div className="space-y-2.5 pt-1">
        {categories.map((cat, idx) => {
          const color = cat.categoryColor || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
          return (
            <div key={`exp_cat_${cat.categoryId || 'cat'}_${idx}`} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {cat.categoryName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(cat.amount, currencySymbol)}
                  </span>
                  <span className="text-[10px] text-gray-400 ml-1.5 font-medium">
                    ({cat.percentage}%)
                  </span>
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
