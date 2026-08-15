import React, { useState } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

export type PeriodOption = 'today' | 'week' | 'month' | 'year' | 'custom';

interface PeriodSelectorProps {
  period: PeriodOption;
  onChangePeriod: (period: PeriodOption) => void;
  customStartDate: string;
  customEndDate: string;
  onChangeCustomDates: (start: string, end: string) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  period,
  onChangePeriod,
  customStartDate,
  customEndDate,
  onChangeCustomDates,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dateError, setDateError] = useState('');

  const labels: Record<PeriodOption, string> = {
    today: 'Today',
    week: 'This Week (Mon-Sun)',
    month: 'This Month',
    year: 'This Year',
    custom: 'Custom Range',
  };

  const handleCustomStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (customEndDate && val > customEndDate) {
      setDateError('Start date cannot be after End date');
    } else {
      setDateError('');
    }
    onChangeCustomDates(val, customEndDate);
  };

  const handleCustomEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (customStartDate && customStartDate > val) {
      setDateError('End date cannot be before Start date');
    } else {
      setDateError('');
    }
    onChangeCustomDates(customStartDate, val);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Time Period</span>
        </label>

        {/* Dropdown Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2 shadow-2xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <span>{labels[period]}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {isOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
              <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl z-30 py-1.5 space-y-0.5">
                {(['today', 'week', 'month', 'year', 'custom'] as PeriodOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      onChangePeriod(opt);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between cursor-pointer ${
                      period === opt
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span>{labels[opt]}</span>
                    {period === opt && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Custom Date Range Controls */}
      {period === 'custom' && (
        <div className="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xs space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={handleCustomStartChange}
                className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                End Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={handleCustomEndChange}
                className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {dateError && <p className="text-[11px] font-bold text-red-500">{dateError}</p>}
        </div>
      )}
    </div>
  );
};
