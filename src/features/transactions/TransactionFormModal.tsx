import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { Transaction, CategoryType, Category } from '../../types';
import { parseCurrencyInput, toMajorUnits } from '../../utils/currency';
import { getCurrentDateISO, getCurrentTime24, extractDateAndTime } from '../../utils/date';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { CategoryManagerModal } from '../categories/CategoryManagerModal';
import { X, Calendar, Clock, FileText, Wallet, Plus, AlertCircle } from 'lucide-react';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'income' | 'expense';
  initialTransaction?: Transaction | null;
  onSuccess?: (msg: string) => void;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'expense',
  initialTransaction = null,
  onSuccess,
}) => {
  const {
    accounts,
    categories,
    selectedAccountId,
    addIncomeExpense,
    updateTransaction,
    profile,
  } = useAppStore();

  const currencySymbol = profile?.currencySymbol || '₹';

  // Active Accounts
  const activeAccounts = accounts.filter((a) => a.isActive);

  // Form State
  const [type, setType] = useState<CategoryType>(defaultType);
  const [amountStr, setAmountStr] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [selectedAccId, setSelectedAccId] = useState('');
  const [dateStr, setDateStr] = useState(getCurrentDateISO());
  const [timeStr, setTimeStr] = useState(getCurrentTime24());
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal for adding custom category directly
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // Filter categories by active type
  const availableCategories = categories.filter((c) => c.type === type && c.isActive);

  // Initialize form state when modal opens or initialTransaction changes
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (initialTransaction) {
        setType(initialTransaction.type === 'income' ? 'income' : 'expense');
        setAmountStr(toMajorUnits(initialTransaction.amount).toString());
        setSelectedCatId(initialTransaction.categoryId || '');
        setSelectedAccId(initialTransaction.accountId);
        const { date, time } = extractDateAndTime(initialTransaction.date);
        setDateStr(date);
        setTimeStr(time);
        setNote(initialTransaction.note || '');
      } else {
        setType(defaultType);
        setAmountStr('');
        setNote('');
        setDateStr(getCurrentDateISO());
        setTimeStr(getCurrentTime24());

        // Default Account
        if (selectedAccountId !== 'ALL' && activeAccounts.some((a) => a.id === selectedAccountId)) {
          setSelectedAccId(selectedAccountId);
        } else if (activeAccounts.length > 0) {
          setSelectedAccId(activeAccounts[0].id);
        }

        // Default Category
        const cats = categories.filter((c) => c.type === defaultType && c.isActive);
        if (cats.length > 0) {
          setSelectedCatId(cats[0].id);
        } else {
          setSelectedCatId('');
        }
      }
    }
  }, [isOpen, initialTransaction, defaultType, selectedAccountId]);

  // When type changes, update default category selection if current is invalid
  const handleTypeChange = (newType: CategoryType) => {
    setType(newType);
    const validCats = categories.filter((c) => c.type === newType && c.isActive);
    if (!validCats.some((c) => c.id === selectedCatId)) {
      setSelectedCatId(validCats.length > 0 ? validCats[0].id : '');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. Amount Validation
    const minorUnits = parseCurrencyInput(amountStr);
    if (minorUnits <= 0) {
      setErrorMsg('Please enter a valid amount greater than zero.');
      return;
    }

    // 2. Category Validation
    if (!selectedCatId) {
      setErrorMsg('Please select a category.');
      return;
    }
    const cat = categories.find((c) => c.id === selectedCatId);
    if (!cat) {
      setErrorMsg('Selected category was not found.');
      return;
    }
    if (cat.type !== type) {
      setErrorMsg(`Selected category is for ${cat.type}, but transaction is ${type}.`);
      return;
    }

    // 3. Account Validation
    if (!selectedAccId) {
      setErrorMsg('Please select an account.');
      return;
    }
    const acc = activeAccounts.find((a) => a.id === selectedAccId);
    if (!acc) {
      setErrorMsg('Selected account is invalid or archived.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (initialTransaction) {
        await updateTransaction({
          id: initialTransaction.id,
          accountId: selectedAccId,
          type,
          amount: minorUnits,
          categoryId: selectedCatId,
          note: note.trim(),
          date: dateStr,
          time: timeStr,
        });
        if (onSuccess) onSuccess('Transaction updated successfully');
      } else {
        await addIncomeExpense({
          accountId: selectedAccId,
          type,
          amount: minorUnits,
          categoryId: selectedCatId,
          note: note.trim(),
          date: dateStr,
          time: timeStr,
        });
        if (onSuccess) onSuccess(`${type === 'income' ? 'Income' : 'Expense'} added successfully`);
      }

      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to save transaction');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
            <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
              {initialTransaction ? 'Edit Transaction' : type === 'expense' ? 'Record Expense' : 'Record Income'}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Type Switcher */}
          {!initialTransaction && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700 flex gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  type === 'expense'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                }`}
              >
                Expense (-)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                }`}
              >
                Income (+)
              </button>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Amount Input */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Amount ({currencySymbol})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl text-xl font-extrabold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Category Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryManagerOpen(true)}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Custom Category</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-2xl">
                {availableCategories.map((cat) => {
                  const isSelected = selectedCatId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCatId(cat.id)}
                      className={`p-2.5 rounded-xl flex flex-col items-center text-center transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 ${
                          isSelected ? 'bg-white/20 text-white' : ''
                        }`}
                        style={{ backgroundColor: isSelected ? undefined : `${cat.color}20` }}
                      >
                        <CategoryIcon name={cat.icon} color={isSelected ? '#FFFFFF' : cat.color} className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold truncate w-full leading-tight">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Account Selector */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-gray-400" />
                <span>Account</span>
              </label>
              <select
                value={selectedAccId}
                onChange={(e) => setSelectedAccId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              >
                {activeAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>Date</span>
                </label>
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Time</span>
                </label>
                <input
                  type="time"
                  value={timeStr}
                  onChange={(e) => setTimeStr(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Note */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                <span>Note (Optional)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Weekly Grocery, Client Payment"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                maxLength={200}
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 py-3 text-white rounded-xl text-xs font-bold transition-all shadow-md ${
                  type === 'expense' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isSubmitting ? 'Saving...' : initialTransaction ? 'Update Transaction' : `Save ${type === 'expense' ? 'Expense' : 'Income'}`}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Category Manager Modal for quick creation */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        defaultType={type}
        onSelectCategory={(newCat) => {
          setSelectedCatId(newCat.id);
        }}
      />
    </>
  );
};
