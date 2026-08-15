import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/appStore';
import { Transaction, Transfer } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { extractDateAndTime, formatGroupDate, isDateInRange, getDateRange } from '../../utils/date';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { TransactionFormModal } from './TransactionFormModal';
import { TransactionDetailModal } from './TransactionDetailModal';
import { CategoryManagerModal } from '../categories/CategoryManagerModal';
import { TransferFormModal } from '../transfers/TransferFormModal';
import { TransferDetailModal } from '../transfers/TransferDetailModal';
import { Toast } from '../../components/ui/Toast';
import {
  Search,
  Filter,
  X,
  Plus,
  ReceiptText,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Calendar,
  SlidersHorizontal,
  RotateCcw,
  ArrowLeftRight,
  ArrowRight,
} from 'lucide-react';

export const TransactionsScreen: React.FC = () => {
  const {
    transactions,
    transfers,
    accounts,
    categories,
    selectedAccountId,
    profile,
  } = useAppStore();

  const currencySymbol = profile?.currencySymbol || '₹';

  // Sub-tab view mode
  const [viewTab, setViewTab] = useState<'all' | 'transactions' | 'transfers'>('all');

  // State for modals & toast
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formDefaultType, setFormDefaultType] = useState<'income' | 'expense'>('expense');
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isTransferFormOpen, setIsTransferFormOpen] = useState(false);
  const [selectedTransferForDetail, setSelectedTransferForDetail] = useState<Transfer | null>(null);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'income' | 'expense'>('ALL');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [dateRangeType, setDateRangeType] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Synchronize global account switch if set
  const activeAccountFilter = accountFilter !== 'ALL' ? accountFilter : selectedAccountId;

  // Filter & Search Logic
  type CombinedActivityItem =
    | { kind: 'transaction'; date: string; amount: number; data: Transaction }
    | { kind: 'transfer'; date: string; amount: number; data: Transfer };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (viewTab === 'transfers') return [];
    return transactions.filter((tx) => {
      // 1. Account Filter
      if (activeAccountFilter !== 'ALL' && tx.accountId !== activeAccountFilter) {
        return false;
      }

      // 2. Type Filter
      if (typeFilter !== 'ALL' && tx.type !== typeFilter) {
        return false;
      }

      // 3. Category Filter
      if (categoryFilter !== 'ALL' && tx.categoryId !== categoryFilter) {
        return false;
      }

      // 4. Date Filter
      if (dateRangeType !== 'all') {
        const { date } = extractDateAndTime(tx.date);
        if (dateRangeType === 'custom') {
          if (customStartDate && customEndDate) {
            if (!isDateInRange(date, customStartDate, customEndDate)) return false;
          }
        } else {
          const range = getDateRange(dateRangeType);
          if (!isDateInRange(date, range.startISO, range.endISO)) return false;
        }
      }

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const noteMatch = tx.note ? tx.note.toLowerCase().includes(q) : false;
        const cat = categories.find((c) => c.id === tx.categoryId);
        const catMatch = cat ? cat.name.toLowerCase().includes(q) : false;
        const acc = accounts.find((a) => a.id === tx.accountId);
        const accMatch = acc ? acc.name.toLowerCase().includes(q) : false;

        if (!noteMatch && !catMatch && !accMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    transactions,
    activeAccountFilter,
    typeFilter,
    categoryFilter,
    dateRangeType,
    customStartDate,
    customEndDate,
    searchQuery,
    categories,
    accounts,
    viewTab,
  ]);

  // Filtered transfers
  const filteredTransfers = useMemo(() => {
    if (viewTab === 'transactions') return [];
    return transfers.filter((tr) => {
      // 1. Account Filter
      if (
        activeAccountFilter !== 'ALL' &&
        tr.fromAccountId !== activeAccountFilter &&
        tr.toAccountId !== activeAccountFilter
      ) {
        return false;
      }

      // 2. Date Filter
      if (dateRangeType !== 'all') {
        const { date } = extractDateAndTime(tr.date);
        if (dateRangeType === 'custom') {
          if (customStartDate && customEndDate) {
            if (!isDateInRange(date, customStartDate, customEndDate)) return false;
          }
        } else {
          const range = getDateRange(dateRangeType);
          if (!isDateInRange(date, range.startISO, range.endISO)) return false;
        }
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const noteMatch = tr.note ? tr.note.toLowerCase().includes(q) : false;
        const fromAcc = accounts.find((a) => a.id === tr.fromAccountId);
        const toAcc = accounts.find((a) => a.id === tr.toAccountId);
        const fromMatch = fromAcc ? fromAcc.name.toLowerCase().includes(q) : false;
        const toMatch = toAcc ? toAcc.name.toLowerCase().includes(q) : false;

        if (!noteMatch && !fromMatch && !toMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    transfers,
    activeAccountFilter,
    dateRangeType,
    customStartDate,
    customEndDate,
    searchQuery,
    accounts,
    viewTab,
  ]);

  // Combined and sorted activity
  const sortedActivities = useMemo(() => {
    const list: CombinedActivityItem[] = [];

    if (viewTab !== 'transfers') {
      filteredTransactions.forEach((tx) =>
        list.push({ kind: 'transaction', date: tx.date, amount: tx.amount, data: tx })
      );
    }

    if (viewTab !== 'transactions') {
      filteredTransfers.forEach((tr) =>
        list.push({ kind: 'transfer', date: tr.date, amount: tr.amount, data: tr })
      );
    }

    return list.sort((a, b) => {
      if (sortBy === 'date_asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === 'amount_desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount_asc') {
        return a.amount - b.amount;
      }
      // default: date_desc
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [filteredTransactions, filteredTransfers, sortBy, viewTab]);

  // Compute Summary Totals for current filtered items
  const { totalIncome, totalExpense, netTotal, totalTransfersAmount } = useMemo(() => {
    let income = 0;
    let expense = 0;
    let transferSum = 0;
    filteredTransactions.forEach((tx) => {
      if (tx.type === 'income') income += tx.amount;
      else if (tx.type === 'expense') expense += tx.amount;
    });
    filteredTransfers.forEach((tr) => {
      transferSum += tr.amount;
    });
    return {
      totalIncome: income,
      totalExpense: expense,
      netTotal: income - expense,
      totalTransfersAmount: transferSum,
    };
  }, [filteredTransactions, filteredTransfers]);

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: { [dateStr: string]: CombinedActivityItem[] } = {};
    sortedActivities.forEach((item) => {
      const { date } = extractDateAndTime(item.date);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });
    return groups;
  }, [sortedActivities]);

  const hasActiveFilters =
    typeFilter !== 'ALL' ||
    accountFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    dateRangeType !== 'all' ||
    searchQuery.trim() !== '';

  const resetFilters = () => {
    setTypeFilter('ALL');
    setAccountFilter('ALL');
    setCategoryFilter('ALL');
    setDateRangeType('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSearchQuery('');
  };

  const handleOpenAddForm = (type: 'income' | 'expense') => {
    setEditingTransaction(null);
    setFormDefaultType(type);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-4 pb-24">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Header Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-black text-gray-900 dark:text-white font-mono">
            Ledger & Transactions
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">
            {sortedActivities.length} recorded {sortedActivities.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap font-mono">
          <button
            onClick={() => handleOpenAddForm('expense')}
            className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Expense</span>
          </button>
          <button
            onClick={() => handleOpenAddForm('income')}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Income</span>
          </button>
          <button
            onClick={() => setIsTransferFormOpen(true)}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Switcher */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit border border-gray-200/60 dark:border-gray-700">
        <button
          onClick={() => setViewTab('all')}
          className={`py-1.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            viewTab === 'all'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-2xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          All Activity ({transactions.length + transfers.length})
        </button>
        <button
          onClick={() => setViewTab('transactions')}
          className={`py-1.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            viewTab === 'transactions'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-2xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          Income & Expense ({transactions.length})
        </button>
        <button
          onClick={() => setViewTab('transfers')}
          className={`py-1.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            viewTab === 'transfers'
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          Transfers ({transfers.length})
        </button>
      </div>

      {/* Financial Summary Card */}
      {viewTab === 'transfers' ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-950/60 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Total Internal Transfers Volume
              </p>
              <p className="text-base font-black text-gray-900 dark:text-white">
                {formatCurrency(totalTransfersAmount, currencySymbol)}
              </p>
            </div>
          </div>
          <span className="text-xs font-extrabold px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800">
            {filteredTransfers.length} Transfers
          </span>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-xs grid grid-cols-3 gap-2 text-center">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Income</span>
            </span>
            <p className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
              {formatCurrency(totalIncome, currencySymbol)}
            </p>
          </div>

          <div className="space-y-0.5 border-x border-gray-100 dark:border-gray-700 px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
              <TrendingDown className="w-3 h-3" />
              <span>Expense</span>
            </span>
            <p className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
              {formatCurrency(totalExpense, currencySymbol)}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Net Total
            </span>
            <p
              className={`text-xs font-extrabold truncate ${
                netTotal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatCurrency(netTotal, currencySymbol)}
            </p>
          </div>
        </div>
      )}

      {/* Search Bar & Filter Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes, categories, accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-medium text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
          className={`p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs ${
            hasActiveFilters
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filter</span>
        </button>
      </div>

      {/* Quick Filter Badges Bar */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {typeFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded-lg text-[10px] font-bold border border-blue-200 dark:border-blue-800">
              Type: {typeFilter.toUpperCase()}
              <button onClick={() => setTypeFilter('ALL')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {accountFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded-lg text-[10px] font-bold border border-blue-200 dark:border-blue-800">
              Account: {accounts.find((a) => a.id === accountFilter)?.name || accountFilter}
              <button onClick={() => setAccountFilter('ALL')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {categoryFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded-lg text-[10px] font-bold border border-blue-200 dark:border-blue-800">
              Category: {categories.find((c) => c.id === categoryFilter)?.name || categoryFilter}
              <button onClick={() => setCategoryFilter('ALL')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {dateRangeType !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded-lg text-[10px] font-bold border border-blue-200 dark:border-blue-800">
              Date: {dateRangeType.toUpperCase()}
              <button onClick={() => setDateRangeType('all')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={resetFilters}
            className="text-[10px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-0.5 ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear All</span>
          </button>
        </div>
      )}

      {/* Filter Drawer / Panel */}
      {isFilterDrawerOpen && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 space-y-3.5 shadow-md animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-gray-900 dark:text-white">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <span>Filter & Sort Options</span>
            </div>
            <button
              onClick={() => setIsFilterDrawerOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Type Filter */}
            <div className="space-y-1">
              <label className="font-bold text-gray-700 dark:text-gray-300">Transaction Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-medium"
              >
                <option value="ALL">All Types</option>
                <option value="income">Income Only</option>
                <option value="expense">Expense Only</option>
              </select>
            </div>

            {/* Account Filter */}
            <div className="space-y-1">
              <label className="font-bold text-gray-700 dark:text-gray-300">Account</label>
              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-medium"
              >
                <option value="ALL">All Accounts</option>
                {accounts.filter((a) => a.isActive).map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="space-y-1">
              <label className="font-bold text-gray-700 dark:text-gray-300">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-medium"
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div className="space-y-1">
              <label className="font-bold text-gray-700 dark:text-gray-300">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-medium"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="col-span-2 space-y-1">
              <label className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Date Range</span>
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['all', 'today', 'week', 'month', 'custom'] as const).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setDateRangeType(range)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold capitalize transition-colors ${
                      dateRangeType === range
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              {dateRangeType === 'custom' && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs"
                  />
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setIsCategoryManagerOpen(true)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Manage Categories
            </button>
            <button
              onClick={() => setIsFilterDrawerOpen(false)}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Transaction & Activity History List */}
      {sortedActivities.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center space-y-3 border border-gray-100 dark:border-slate-800 shadow-xs">
          <div className="inline-flex p-3.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl">
            <ReceiptText className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-gray-900 dark:text-white font-mono">
            {hasActiveFilters ? 'No Matching Ledger Entries' : 'No Ledger Activity Recorded Yet'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xs mx-auto">
            {hasActiveFilters
              ? 'Try adjusting or resetting your search and filter parameters.'
              : 'Start building your financial ledger by manually logging income, expenses, or transfers.'}
          </p>

          <div className="pt-2 flex justify-center gap-2 font-mono">
            {hasActiveFilters ? (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleOpenAddForm('expense')}
                  className="px-3.5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  + Add Expense
                </button>
                <button
                  onClick={() => handleOpenAddForm('income')}
                  className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  + Add Income
                </button>
                <button
                  onClick={() => setIsTransferFormOpen(true)}
                  className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  + Transfer
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {(Object.entries(groupedActivities) as [string, CombinedActivityItem[]][]).map(([dateStr, itemsList]) => (
            <div key={dateStr} className="space-y-2">
              {/* Date Group Header */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {formatGroupDate(dateStr)}
                </span>
                <span className="text-[11px] font-bold text-gray-400">
                  {itemsList.length} item{itemsList.length === 1 ? '' : 's'}
                </span>
              </div>

              {/* Items in group */}
              <div className="space-y-2">
                {itemsList.map((item) => {
                  if (item.kind === 'transaction') {
                    const tx = item.data;
                    const category = categories.find((c) => c.id === tx.categoryId);
                    const account = accounts.find((a) => a.id === tx.accountId);
                    const { formattedTime } = extractDateAndTime(tx.date);

                    return (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedTxForDetail(tx)}
                        className="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex items-center justify-between hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          {/* Category Icon */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs"
                            style={{ backgroundColor: `${category?.color || '#3B82F6'}20` }}
                          >
                            <CategoryIcon
                              name={category?.icon || 'Tag'}
                              color={category?.color || '#3B82F6'}
                              className="w-5 h-5"
                            />
                          </div>

                          {/* Description */}
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
                              {tx.note || category?.name || tx.type.toUpperCase()}
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                              <span>{category?.name || 'Uncategorized'}</span>
                              <span>•</span>
                              <span className="truncate">{account?.name || 'Account'}</span>
                              <span>•</span>
                              <span>{formattedTime}</span>
                            </div>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right flex-shrink-0">
                          <p
                            className={`text-xs font-extrabold tracking-tight ${
                              tx.type === 'income'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {tx.type === 'income' ? '+' : '-'}
                            {formatCurrency(tx.amount, currencySymbol)}
                          </p>
                        </div>
                      </div>
                    );
                  } else {
                    // Transfer item
                    const tr = item.data;
                    const fromAcc = accounts.find((a) => a.id === tr.fromAccountId);
                    const toAcc = accounts.find((a) => a.id === tr.toAccountId);
                    const { formattedTime } = extractDateAndTime(tr.date);

                    return (
                      <div
                        key={tr.id}
                        onClick={() => setSelectedTransferForDetail(tr)}
                        className="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-950/60 shadow-xs flex items-center justify-between hover:border-indigo-300 dark:hover:border-indigo-600 transition-all cursor-pointer active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <ArrowLeftRight className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
                              {tr.note || 'Account Transfer'}
                            </p>
                            <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 truncate">
                              <span className="font-semibold">{fromAcc?.name || 'Source'}</span>
                              <ArrowRight className="w-3 h-3 text-indigo-400 inline shrink-0" />
                              <span className="font-semibold">{toAcc?.name || 'Dest'}</span>
                              <span>• {formattedTime}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                            {formatCurrency(tr.amount, currencySymbol)}
                          </p>
                          <span className="text-[9px] uppercase font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded-md">
                            Transfer
                          </span>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <TransactionFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        defaultType={formDefaultType}
        initialTransaction={editingTransaction}
        onSuccess={(msg) => setToastMessage(msg)}
      />

      <TransactionDetailModal
        isOpen={!!selectedTxForDetail}
        transaction={selectedTxForDetail}
        onClose={() => setSelectedTxForDetail(null)}
        onEdit={(txToEdit) => {
          setEditingTransaction(txToEdit);
          setIsFormOpen(true);
        }}
        onSuccessToast={(msg) => setToastMessage(msg)}
      />

      <TransferFormModal
        isOpen={isTransferFormOpen}
        onClose={() => setIsTransferFormOpen(false)}
      />

      <TransferDetailModal
        isOpen={!!selectedTransferForDetail}
        transfer={selectedTransferForDetail}
        onClose={() => setSelectedTransferForDetail(null)}
      />

      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
      />
    </div>
  );
};
