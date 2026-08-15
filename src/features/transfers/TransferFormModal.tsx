import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { Transfer } from '../../types';
import { formatCurrency, parseCurrencyInput, toMajorUnits } from '../../utils/currency';
import { getCurrentDateISO, getCurrentTime24, extractDateAndTime } from '../../utils/date';
import { X, ArrowRight, Wallet, Calendar, Clock, FileText, AlertCircle, ArrowLeftRight } from 'lucide-react';

interface TransferFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransfer?: Transfer | null;
  initialSourceAccountId?: string;
}

export const TransferFormModal: React.FC<TransferFormModalProps> = ({
  isOpen,
  onClose,
  editingTransfer = null,
  initialSourceAccountId,
}) => {
  const { accounts, selectedAccountId, profile, addTransfer, updateTransfer } = useAppStore();

  const activeAccounts = accounts.filter((a) => a.isActive);
  const currencySymbol = profile?.currencySymbol || '₹';

  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [date, setDate] = useState<string>(getCurrentDateISO());
  const [time, setTime] = useState<string>(getCurrentTime24());
  const [note, setNote] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    setErrorMessage('');

    if (editingTransfer) {
      setFromAccountId(editingTransfer.fromAccountId);
      setToAccountId(editingTransfer.toAccountId);
      setAmountStr(toMajorUnits(editingTransfer.amount).toString());
      const { date: d, time: t } = extractDateAndTime(editingTransfer.date);
      setDate(d);
      setTime(t);
      setNote(editingTransfer.note || '');
    } else {
      // Set initial source account
      let defaultFromId = initialSourceAccountId;
      if (!defaultFromId && selectedAccountId !== 'ALL' && activeAccounts.some((a) => a.id === selectedAccountId)) {
        defaultFromId = selectedAccountId;
      }
      if (!defaultFromId && activeAccounts.length > 0) {
        defaultFromId = activeAccounts[0].id;
      }
      setFromAccountId(defaultFromId || '');

      // Set initial destination account (first active account different from defaultFromId)
      const defaultToAcc = activeAccounts.find((a) => a.id !== defaultFromId);
      setToAccountId(defaultToAcc ? defaultToAcc.id : '');

      setAmountStr('');
      setDate(getCurrentDateISO());
      setTime(getCurrentTime24());
      setNote('');
    }
  }, [isOpen, editingTransfer, initialSourceAccountId, selectedAccountId]);

  if (!isOpen) return null;

  const sourceAccount = accounts.find((a) => a.id === fromAccountId);
  const destAccount = accounts.find((a) => a.id === toAccountId);

  // Available balance calculation for validation display
  let availableBalance = sourceAccount ? sourceAccount.currentBalance : 0;
  if (editingTransfer && editingTransfer.fromAccountId === fromAccountId) {
    availableBalance += editingTransfer.amount;
  }

  const handleFromAccountChange = (newFromId: string) => {
    setFromAccountId(newFromId);
    setErrorMessage('');
    if (newFromId === toAccountId) {
      const nextTo = activeAccounts.find((a) => a.id !== newFromId);
      setToAccountId(nextTo ? nextTo.id : '');
    }
  };

  const handleSwapAccounts = () => {
    if (!fromAccountId || !toAccountId) return;
    const temp = fromAccountId;
    setFromAccountId(toAccountId);
    setToAccountId(temp);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fromAccountId) {
      setErrorMessage('Please select a source account.');
      return;
    }
    if (!toAccountId) {
      setErrorMessage('Please select a destination account.');
      return;
    }
    if (fromAccountId === toAccountId) {
      setErrorMessage('Source and destination accounts must be different.');
      return;
    }

    const amountPaise = parseCurrencyInput(amountStr);
    if (isNaN(amountPaise) || amountPaise <= 0) {
      setErrorMessage('Please enter a valid transfer amount greater than 0.');
      return;
    }

    if (amountPaise > availableBalance) {
      setErrorMessage('Insufficient balance.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTransfer) {
        await updateTransfer({
          id: editingTransfer.id,
          sourceAccountId: fromAccountId,
          destinationAccountId: toAccountId,
          amount: amountPaise,
          note: note.trim() || undefined,
          date,
          time,
        });
      } else {
        await addTransfer({
          sourceAccountId: fromAccountId,
          destinationAccountId: toAccountId,
          amount: amountPaise,
          note: note.trim() || undefined,
          date,
          time,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to complete transfer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-sm w-full p-6 space-y-4 border border-gray-100 dark:border-gray-700 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              {editingTransfer ? 'Edit Transfer' : 'Transfer Money'}
            </h3>
            <p className="text-xs text-gray-400 font-medium">Move funds between accounts</p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 text-xs rounded-xl font-medium flex items-center gap-2 border border-red-100 dark:border-red-900">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* FROM -> TO ACCOUNTS */}
          <div className="space-y-2 bg-slate-50 dark:bg-gray-700/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 relative">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  From Account
                </label>
                {sourceAccount && (
                  <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Avail: <strong className="text-gray-900 dark:text-white">{formatCurrency(availableBalance, currencySymbol)}</strong>
                  </span>
                )}
              </div>
              <select
                value={fromAccountId}
                onChange={(e) => handleFromAccountChange(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                required
              >
                {activeAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.currentBalance, currencySymbol)})
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-1 relative z-10">
              <button
                type="button"
                onClick={handleSwapAccounts}
                title="Swap From & To Accounts"
                className="p-1.5 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-indigo-600 dark:text-indigo-400 rounded-full border border-gray-200 dark:border-gray-600 shadow-xs cursor-pointer transition-transform hover:scale-110"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  To Account
                </label>
                {destAccount && (
                  <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Bal: <strong className="text-gray-900 dark:text-white">{formatCurrency(destAccount.currentBalance, currencySymbol)}</strong>
                  </span>
                )}
              </div>
              <select
                value={toAccountId}
                onChange={(e) => {
                  setToAccountId(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                required
              >
                {activeAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id} disabled={acc.id === fromAccountId}>
                    {acc.name} {acc.id === fromAccountId ? '(Selected as Source)' : `(${formatCurrency(acc.currentBalance, currencySymbol)})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* AMOUNT INPUT */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              Transfer Amount ({currencySymbol}) <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full pl-8 pr-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-base font-black text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
                autoFocus={!editingTransfer}
              />
            </div>
          </div>

          {/* DATE & TIME */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* NOTE */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              Note / Description <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. ATM withdrawal, savings transfer"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* SUBMIT BUTTONS */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingTransfer ? 'Update Transfer' : 'Complete Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
