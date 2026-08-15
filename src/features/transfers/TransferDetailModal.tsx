import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Transfer } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { extractDateAndTime } from '../../utils/date';
import { ACCOUNT_TYPE_LABELS } from '../../constants';
import { X, Edit3, Trash2, ArrowRight, Calendar, Clock, FileText, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import { TransferFormModal } from './TransferFormModal';

interface TransferDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfer: Transfer | null;
}

export const TransferDetailModal: React.FC<TransferDetailModalProps> = ({ isOpen, onClose, transfer }) => {
  const { accounts, profile, deleteTransfer } = useAppStore();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !transfer) return null;

  const currencySymbol = profile?.currencySymbol || '₹';

  const fromAcc = accounts.find((a) => a.id === transfer.fromAccountId);
  const toAcc = accounts.find((a) => a.id === transfer.toAccountId);

  const { formattedDate, formattedTime } = extractDateAndTime(transfer.date);

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteTransfer(transfer.id);
      setIsDeleteConfirmOpen(false);
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete transfer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-sm w-full p-6 space-y-5 border border-gray-100 dark:border-gray-700 shadow-2xl relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                Transfer
              </span>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mt-1">
                {formatCurrency(transfer.amount, currencySymbol)}
              </h3>
            </div>
          </div>

          {/* FROM -> TO FLOW DISPLAY */}
          <div className="bg-slate-50 dark:bg-gray-700/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">From</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {fromAcc ? fromAcc.name : 'Unknown Account'}
                </p>
                {fromAcc && (
                  <p className="text-[11px] text-gray-400 capitalize">{ACCOUNT_TYPE_LABELS[fromAcc.type]}</p>
                )}
              </div>

              <div className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-2xs text-indigo-600 dark:text-indigo-400">
                <ArrowRight className="w-4 h-4" />
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-gray-400">To</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {toAcc ? toAcc.name : 'Unknown Account'}
                </p>
                {toAcc && <p className="text-[11px] text-gray-400 capitalize">{ACCOUNT_TYPE_LABELS[toAcc.type]}</p>}
              </div>
            </div>
          </div>

          {/* METADATA DETAILS */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
              <span className="flex items-center gap-1.5 text-gray-400 font-medium">
                <Calendar className="w-3.5 h-3.5" /> Date
              </span>
              <span className="font-bold">{formattedDate}</span>
            </div>

            <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
              <span className="flex items-center gap-1.5 text-gray-400 font-medium">
                <Clock className="w-3.5 h-3.5" /> Time
              </span>
              <span className="font-bold">{formattedTime}</span>
            </div>

            {transfer.note && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1">
                <span className="flex items-center gap-1.5 text-gray-400 font-medium">
                  <FileText className="w-3.5 h-3.5" /> Note
                </span>
                <p className="text-xs text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 p-2.5 rounded-xl font-medium leading-relaxed">
                  {transfer.note}
                </p>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => setIsEditOpen(true)}
              className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-indigo-500" />
              <span>Edit Transfer</span>
            </button>

            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="py-2.5 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {isEditOpen && (
        <TransferFormModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            onClose();
          }}
          editingTransfer={transfer}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-55 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-sm w-full p-6 space-y-4 border border-gray-100 dark:border-gray-700 shadow-2xl">
            <div className="p-3 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl w-fit">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Transfer?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                This will remove the transfer between {fromAcc?.name || 'source'} and {toAcc?.name || 'destination'}. Account balances will be recalculated automatically.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
