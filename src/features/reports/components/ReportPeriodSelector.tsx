import React, { useState } from 'react';
import { ReportPeriod } from '../types';
import { Calendar, Filter, ChevronDown } from 'lucide-react';
import { DbAccount } from '../../../database/queries/accountQueries';

interface ReportPeriodSelectorProps {
  period: ReportPeriod;
  onPeriodChange: (p: ReportPeriod) => void;
  selectedAccountId: string;
  onAccountChange: (accId: string) => void;
  accounts: DbAccount[];
  startDate: string;
  endDate: string;
  onCustomDateChange: (start: string, end: string) => void;
  rangeLabel: string;
}

export const ReportPeriodSelector: React.FC<ReportPeriodSelectorProps> = ({
  period,
  onPeriodChange,
  selectedAccountId,
  onAccountChange,
  accounts,
  startDate,
  endDate,
  onCustomDateChange,
  rangeLabel,
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);
  const [customError, setCustomError] = useState<string | null>(null);

  const handlePeriodClick = (p: ReportPeriod) => {
    if (p === 'custom') {
      setShowCustomModal(true);
    } else {
      onPeriodChange(p);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) {
      setCustomError('Please select both start and end dates.');
      return;
    }
    if (customStart > customEnd) {
      setCustomError('Start date cannot be after End date.');
      return;
    }
    setCustomError(null);
    onCustomDateChange(customStart, customEnd);
    onPeriodChange('custom');
    setShowCustomModal(false);
  };

  const periods: { id: ReportPeriod; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-3">
      {/* Period Tabs & Account Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-2xs">
        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {periods.map((p) => {
            const isActive = period === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePeriodClick(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs scale-[1.02]'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Account Filter Select */}
        <div className="relative min-w-[140px]">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300">
            <Filter className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <select
              value={selectedAccountId}
              onChange={(e) => onAccountChange(e.target.value)}
              className="bg-transparent w-full focus:outline-hidden appearance-none pr-4 cursor-pointer font-semibold text-gray-800 dark:text-gray-200"
            >
              <option value="ALL">All Accounts</option>
              {accounts.map((acc, idx) => (
                <option key={`rep_acc_opt_${acc.id}_${idx}`} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Date Range Badge */}
      <div className="flex items-center justify-between px-1 text-xs font-medium text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-500" />
          <span>{rangeLabel}</span>
        </div>
        {period === 'custom' && (
          <button
            onClick={() => setShowCustomModal(true)}
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold text-[11px]"
          >
            Edit Range
          </button>
        )}
      </div>

      {/* Custom Date Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" /> Select Custom Range
              </h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleApplyCustom} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-600 dark:text-gray-300 font-semibold mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-gray-600 dark:text-gray-300 font-semibold mb-1">End Date</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-gray-100"
                />
              </div>

              {customError && <p className="text-red-500 text-[11px] font-semibold">{customError}</p>}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                >
                  Apply Range
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
