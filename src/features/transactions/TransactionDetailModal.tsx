import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Transaction } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { extractDateAndTime } from '../../utils/date';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { X, Calendar, Clock, Wallet, FileText, Trash2, Edit3, AlertTriangle } from 'lucide-react';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
  onSuccessToast?: (msg: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onEdit,
  onSuccessToast,
}) => {
  const { categories, accounts, deleteTransaction, profile } = useAppStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !transaction) return null;

  const currencySymbol = profile?.currencySymbol || '₹';
  const category = categories.find((c) => c.id === transaction.categoryId);
  const account = accounts.find((a) => a.id === transaction.accountId);
  const { formattedDate, formattedTime } = extractDateAndTime(transaction.date);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTransaction(transaction.id);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      onClose();
      if (onSuccessToast) onSuccessToast('Transaction deleted successfully');
    } catch (err) {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200 relative">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              transaction.type === 'income'
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300'
            }`}
          >
            {transaction.type}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Amount Display */}
          <div className="text-center space-y-1">
            <p
              className={`text-3xl font-extrabold tracking-tight ${
                transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(transaction.amount, currencySymbol)}
            </p>
            {transaction.note && (
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {transaction.note}
              </p>
            )}
          </div>

          {/* Details Card */}
          <div className="bg-gray-50 dark:bg-gray-700/40 rounded-2xl p-4 space-y-3.5 border border-gray-100 dark:border-gray-700/60">
            {/* Category */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Category</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${category?.color || '#3B82F6'}20` }}
                >
                  <CategoryIcon
                    name={category?.icon || 'Tag'}
                    color={category?.color || '#3B82F6'}
                    className="w-3.5 h-3.5"
                  />
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {category?.name || 'Uncategorized'}
                </span>
              </div>
            </div>

            {/* Account */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-gray-400" />
                <span>Account</span>
              </span>
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                {account?.name || 'Unknown Account'}
              </span>
            </div>

            {/* Date */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Date</span>
              </span>
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                {formattedDate}
              </span>
            </div>

            {/* Time */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>Time</span>
              </span>
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                {formattedTime}
              </span>
            </div>

            {/* Note detail if long */}
            {transaction.note && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1 mb-1">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  <span>Note</span>
                </span>
                <p className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700">
                  {transaction.note}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                onClose();
                onEdit(transaction);
              }}
              className="flex-1 py-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 py-2.5 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Overlay */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 max-w-xs text-center space-y-3 border border-gray-200 dark:border-gray-700">
              <div className="p-3 bg-red-50 dark:bg-red-950/60 text-red-500 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Delete Transaction?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This will permanently remove this transaction from SQLite and recalculate your account balance.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
