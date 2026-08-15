import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { formatCurrency, parseCurrencyInput } from '../../utils/currency';
import { extractDateAndTime } from '../../utils/date';
import { Account, AccountType, Transfer } from '../../types';
import { ACCOUNT_TYPE_LABELS } from '../../constants';
import { TransferFormModal } from '../transfers/TransferFormModal';
import { TransferDetailModal } from '../transfers/TransferDetailModal';
import {
  Wallet,
  Plus,
  Landmark,
  Banknote,
  CreditCard,
  PiggyBank,
  Coins,
  Archive,
  Trash2,
  Edit3,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  RotateCcw,
  ArrowLeftRight,
  ArrowRight,
} from 'lucide-react';

export const AccountsScreen: React.FC = () => {
  const { accounts, transfers, profile, addAccount, updateAccount, archiveAccount, deleteAccount, setSelectedAccount, setActiveTab } =
    useAppStore();

  const [activeSubTab, setActiveSubTab] = useState<'active' | 'archived'>('active');
  const [selectedAccForDetail, setSelectedAccForDetail] = useState<Account | null>(null);

  // Transfer Modal states
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferInitialSourceId, setTransferInitialSourceId] = useState<string | undefined>(undefined);
  const [selectedTransferForDetail, setSelectedTransferForDetail] = useState<Transfer | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<AccountType>('bank');
  const [formOpeningBalanceStr, setFormOpeningBalanceStr] = useState('0');
  const [formColor, setFormColor] = useState('#3B82F6');
  const [formIcon, setFormIcon] = useState('Landmark');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currencySymbol = profile?.currencySymbol || '₹';

  const activeAccounts = accounts.filter((a) => a.isActive);
  const archivedAccounts = accounts.filter((a) => !a.isActive);

  const getAccountIconComponent = (type: string, className = 'w-5 h-5') => {
    switch (type) {
      case 'bank':
        return <Landmark className={`${className} text-blue-500`} />;
      case 'cash':
        return <Banknote className={`${className} text-emerald-500`} />;
      case 'credit_card':
        return <CreditCard className={`${className} text-purple-500`} />;
      case 'wallet':
        return <Wallet className={`${className} text-amber-500`} />;
      default:
        return <Coins className={`${className} text-indigo-500`} />;
    }
  };

  const openAddModal = () => {
    setFormName('');
    setFormType('bank');
    setFormOpeningBalanceStr('0');
    setFormColor('#3B82F6');
    setFormIcon('Landmark');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (acc: Account) => {
    setSelectedAccForDetail(acc);
    setFormName(acc.name);
    setFormType(acc.type);
    setFormOpeningBalanceStr((acc.openingBalance / 100).toString());
    setFormColor(acc.color || '#3B82F6');
    setFormIcon(acc.icon || 'Landmark');
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Account name is required.');
      return;
    }
    const paise = parseCurrencyInput(formOpeningBalanceStr);
    if (isNaN(paise)) {
      setFormError('Invalid opening balance number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addAccount({
        name: formName.trim(),
        type: formType,
        openingBalance: paise,
        currentBalance: paise,
        color: formColor,
        icon: formIcon,
        isActive: true,
      });
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccForDetail) return;
    if (!formName.trim()) {
      setFormError('Account name is required.');
      return;
    }
    const paise = parseCurrencyInput(formOpeningBalanceStr);
    if (isNaN(paise)) {
      setFormError('Invalid opening balance number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateAccount({
        ...selectedAccForDetail,
        name: formName.trim(),
        type: formType,
        openingBalance: paise,
        color: formColor,
        icon: formIcon,
      });
      setIsEditModalOpen(false);
      setSelectedAccForDetail(null);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to update account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!selectedAccForDetail) return;
    setIsSubmitting(true);
    try {
      await archiveAccount(selectedAccForDetail.id);
      setIsArchiveConfirmOpen(false);
      setSelectedAccForDetail(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to archive account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAttempt = async () => {
    if (!selectedAccForDetail) return;
    setIsSubmitting(true);
    setDeleteErrorMessage('');
    try {
      const res = await deleteAccount(selectedAccForDetail.id);
      if (res.success) {
        setIsDeleteConfirmOpen(false);
        setSelectedAccForDetail(null);
      } else {
        setDeleteErrorMessage(
          res.message ||
            'This account contains financial history and cannot be permanently deleted. You can archive it instead.'
        );
      }
    } catch (err: any) {
      setDeleteErrorMessage(err?.message || 'Failed to delete account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnarchive = async (acc: Account) => {
    await updateAccount({ ...acc, isActive: true });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('active')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeSubTab === 'active'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            }`}
          >
            Active ({activeAccounts.length})
          </button>
          {archivedAccounts.length > 0 && (
            <button
              onClick={() => setActiveSubTab('archived')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeSubTab === 'archived'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              Archived ({archivedAccounts.length})
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTransferInitialSourceId(undefined);
              setIsTransferModalOpen(true);
            }}
            className="flex items-center gap-1.5 py-2 px-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all cursor-pointer border border-indigo-200 dark:border-indigo-800"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Transfer</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      {activeSubTab === 'active' ? (
        activeAccounts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center border border-gray-100 dark:border-gray-700 space-y-3">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl mx-auto flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">No Active Accounts</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              You don't have any active accounts. Create an account to start tracking your financial transactions.
            </p>
            <button
              onClick={openAddModal}
              className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Account</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeAccounts.map((acc, idx) => (
              <div
                key={`acc_active_${acc.id}_${idx}`}
                onClick={() => setSelectedAccForDetail(acc)}
                className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-2xs hover:shadow-md transition-all space-y-3 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gray-50 dark:bg-gray-750 rounded-xl group-hover:scale-105 transition-transform">
                      {getAccountIconComponent(acc.type)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {acc.name}
                      </h3>
                      <p className="text-[11px] text-gray-400 font-medium capitalize">{ACCOUNT_TYPE_LABELS[acc.type]}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                    Active
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">Calculated Balance</span>
                  <span className="text-base font-black text-gray-900 dark:text-white">
                    {formatCurrency(acc.currentBalance, currencySymbol)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Archived Accounts List */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {archivedAccounts.map((acc, idx) => (
            <div
              key={`acc_archived_${acc.id}_${idx}`}
              className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 opacity-75 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl">{getAccountIconComponent(acc.type)}</div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white line-through">{acc.name}</h3>
                    <p className="text-[11px] text-gray-400">{ACCOUNT_TYPE_LABELS[acc.type]}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                  Archived
                </span>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <span className="text-xs text-gray-400">Historical Balance</span>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  {formatCurrency(acc.currentBalance, currencySymbol)}
                </span>
              </div>

              <button
                onClick={() => handleUnarchive(acc)}
                className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Account</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ACCOUNT DETAIL MODAL */}
      {selectedAccForDetail && !isEditModalOpen && !isArchiveConfirmOpen && !isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-sm w-full p-6 space-y-5 border border-gray-100 dark:border-gray-700 shadow-2xl relative">
            <button
              onClick={() => setSelectedAccForDetail(null)}
              className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-2xl">
                {getAccountIconComponent(selectedAccForDetail.type, 'w-6 h-6')}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedAccForDetail.name}</h3>
                <p className="text-xs text-gray-400 font-medium capitalize">
                  {ACCOUNT_TYPE_LABELS[selectedAccForDetail.type]}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-gray-750/50 p-4 rounded-2xl space-y-3 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Current Derived Balance</span>
                <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                  {formatCurrency(selectedAccForDetail.currentBalance, currencySymbol)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200/60 dark:border-gray-700 pt-2">
                <span className="text-xs text-gray-400">Opening Balance</span>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {formatCurrency(selectedAccForDetail.openingBalance, currencySymbol)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200/60 dark:border-gray-700 pt-2">
                <span className="text-xs text-gray-400">Status</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedAccForDetail.isActive ? 'Active' : 'Archived'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => openEditModal(selectedAccForDetail)}
                className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl transition-colors flex flex-col items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-blue-500" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => setIsArchiveConfirmOpen(true)}
                className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-xl transition-colors flex flex-col items-center gap-1 cursor-pointer"
              >
                <Archive className="w-4 h-4 text-amber-500" />
                <span>Archive</span>
              </button>

              <button
                onClick={() => {
                  setDeleteErrorMessage('');
                  setIsDeleteConfirmOpen(true);
                }}
                className="py-2.5 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl transition-colors flex flex-col items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>Delete</span>
              </button>
            </div>

            {/* Quick Transfer Button for this account */}
            {selectedAccForDetail.isActive && (
              <button
                onClick={() => {
                  const srcId = selectedAccForDetail.id;
                  setSelectedAccForDetail(null);
                  setTransferInitialSourceId(srcId);
                  setIsTransferModalOpen(true);
                }}
                className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-indigo-200 dark:border-indigo-800 cursor-pointer transition-colors"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Transfer Money from this Account</span>
              </button>
            )}

            {/* Recent Account Transfers Section */}
            {(() => {
              const accTransfers = transfers.filter(
                (tr) => tr.fromAccountId === selectedAccForDetail.id || tr.toAccountId === selectedAccForDetail.id
              );
              if (accTransfers.length === 0) return null;

              return (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    Recent Account Transfers
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {accTransfers.slice(0, 4).map((tr) => {
                      const isOutgoing = tr.fromAccountId === selectedAccForDetail.id;
                      const otherAccId = isOutgoing ? tr.toAccountId : tr.fromAccountId;
                      const otherAcc = accounts.find((a) => a.id === otherAccId);
                      const { formattedDate } = extractDateAndTime(tr.date);

                      return (
                        <div
                          key={tr.id}
                          onClick={() => {
                            setSelectedAccForDetail(null);
                            setSelectedTransferForDetail(tr);
                          }}
                          className="p-2 bg-slate-50 dark:bg-gray-750/70 rounded-xl text-xs flex items-center justify-between border border-gray-100 dark:border-gray-700 hover:border-indigo-300 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                isOutgoing
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              }`}
                            >
                              {isOutgoing ? 'OUT' : 'IN'}
                            </span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                              {isOutgoing ? `To ${otherAcc?.name || 'Account'}` : `From ${otherAcc?.name || 'Account'}`}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-gray-900 dark:text-white">
                              {formatCurrency(tr.amount, currencySymbol)}
                            </span>
                            <span className="text-[10px] text-gray-400 block">{formattedDate}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ADD ACCOUNT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-sm w-full p-6 space-y-4 border border-gray-100 dark:border-gray-700 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Add New Account</h3>

            {formError && (
              <div className="p-3 bg-red-50 text-red-600 dark:bg-red-950/50 text-xs rounded-xl font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Savings, Cash Wallet"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                  Account Type
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as AccountType)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                  Opening Balance ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={formOpeningBalanceStr}
                  onChange={(e) => setFormOpeningBalanceStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ACCOUNT MODAL */}
      {isEditModalOpen && selectedAccForDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-sm w-full p-6 space-y-4 border border-gray-100 dark:border-gray-700 shadow-2xl relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Edit Account</h3>

            {formError && (
              <div className="p-3 bg-red-50 text-red-600 dark:bg-red-950/50 text-xs rounded-xl font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                  Account Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                  Account Type
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as AccountType)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                  Opening Balance ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="any"
                  value={formOpeningBalanceStr}
                  onChange={(e) => setFormOpeningBalanceStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  If financial history exists, changing this logs an opening balance adjustment to preserve transaction logs.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Update Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ARCHIVE CONFIRMATION MODAL */}
      {isArchiveConfirmOpen && selectedAccForDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-sm w-full p-6 space-y-4 border border-gray-100 dark:border-gray-700 shadow-2xl">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl w-fit">
              <Archive className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Archive "{selectedAccForDetail.name}"?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Archived accounts are hidden from everyday account lists, but all transaction history and balance history will be safely preserved.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsArchiveConfirmOpen(false)}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveConfirm}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Archiving...' : 'Archive Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION / SAFETY MODAL */}
      {isDeleteConfirmOpen && selectedAccForDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-sm w-full p-6 space-y-4 border border-gray-100 dark:border-gray-700 shadow-2xl">
            <div className="p-3 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl w-fit">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Delete "{selectedAccForDetail.name}"?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to permanently delete this account?
              </p>
            </div>

            {deleteErrorMessage ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 text-xs rounded-xl font-medium border border-amber-200 dark:border-amber-900 space-y-2">
                <p>{deleteErrorMessage}</p>
                <button
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setIsArchiveConfirmOpen(true);
                  }}
                  className="w-full py-1.5 bg-amber-600 text-white font-bold rounded-lg text-xs"
                >
                  Archive Account Instead
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAttempt}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Checking...' : 'Delete Account'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TRANSFER FORM MODAL */}
      <TransferFormModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        initialSourceAccountId={transferInitialSourceId}
      />

      {/* TRANSFER DETAIL MODAL */}
      <TransferDetailModal
        isOpen={!!selectedTransferForDetail}
        transfer={selectedTransferForDetail}
        onClose={() => setSelectedTransferForDetail(null)}
      />
    </div>
  );
};
