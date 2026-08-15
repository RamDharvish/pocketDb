import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { IncomeVsExpenseTrendPoint } from '../types';
import { formatCurrency, toMajorUnits } from '../../../utils/currency';
import { TrendingUp } from 'lucide-react';

interface IncomeExpenseChartProps {
  data: IncomeVsExpenseTrendPoint[];
  currencySymbol?: string;
}

const CustomTooltip = ({ active, payload, label, currencySymbol }: any) => {
  if (active && payload && payload.length) {
    const incVal = payload.find((p: any) => p.dataKey === 'incomeMajor')?.value || 0;
    const expVal = payload.find((p: any) => p.dataKey === 'expenseMajor')?.value || 0;

    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg text-xs space-y-1">
        <p className="font-bold text-gray-800 dark:text-gray-100">{label}</p>
        <div className="flex items-center justify-between gap-4 text-emerald-600 dark:text-emerald-400 font-semibold">
          <span>Income:</span>
          <span>{formatCurrency(Math.round(incVal * 100), currencySymbol)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-red-600 dark:text-red-400 font-semibold">
          <span>Expense:</span>
          <span>{formatCurrency(Math.round(expVal * 100), currencySymbol)}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({ data, currencySymbol = '₹' }) => {
  const chartData = data.map((d) => ({
    label: d.label,
    incomeMajor: toMajorUnits(d.income),
    expenseMajor: toMajorUnits(d.expense),
  }));

  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  if (!hasData) {
    return (
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/80 space-y-2 text-center">
        <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center justify-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-blue-500" /> Income vs Expenses
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 py-6">
          No income or expense data available for this period.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/80 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-blue-500" /> Income vs Expenses
        </h3>
        <span className="text-[10px] font-semibold text-gray-400">Comparison</span>
      </div>

      <div className="h-56 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.15} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#6B7280' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${currencySymbol}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip content={<CustomTooltip currencySymbol={currencySymbol} />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              formatter={(value) => (value === 'incomeMajor' ? 'Income' : 'Expense')}
            />
            <Bar dataKey="incomeMajor" name="incomeMajor" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="expenseMajor" name="expenseMajor" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
