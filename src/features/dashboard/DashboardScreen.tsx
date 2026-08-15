import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../../store/appStore';
import { dbManager } from '../../database/database';
import { formatCurrency, parseCurrencyInput } from '../../utils/currency';
import { extractDateAndTime, getDateRange } from '../../utils/date';
import { ACCOUNT_TYPE_LABELS } from '../../constants';
import { AccountType, Transaction, Transfer } from '../../types';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { PocketDbLogo } from '../../components/ui/PocketDbLogo';
import { PeriodSelector, PeriodOption } from './components/PeriodSelector';
import { SummaryCard } from './components/SummaryCard';
import { TopCategoriesCard } from './components/TopCategoriesCard';
import { AccountSpendingCard } from './components/AccountSpendingCard';
import { TransactionFormModal } from '../transactions/TransactionFormModal';
import { TransactionDetailModal } from '../transactions/TransactionDetailModal';
import { TransferFormModal } from '../transfers/TransferFormModal';
import { TransferDetailModal } from '../transfers/TransferDetailModal';
import { Toast } from '../../components/ui/Toast';
import {
  CategorySpendingSummary,
  AccountSpendingSummary,
  DbActivityItem,
} from '../../database/queries/transactionQueries';
import {
  Wallet,
  Landmark,
  Banknote,
  CreditCard,
  Plus,
  Coins,
  ChevronRight,
  Sparkles,
  X,
  TrendingDown,
  TrendingUp,
  ReceiptText,
  ArrowLeftRight,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Filter,
  ShieldCheck,
  HardDrive,
  Database,
} from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const {
    profile,
    accounts,
    transactions,
    transfers,
    categories,
    selectedAccountId,
    setSelectedAccount,
    setActiveTab,
    addAccount,
    initApp,
  } = useAppStore();

  // Period filter state
  const [period, setPeriod] = useState<PeriodOption>('month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Loaded database aggregate metrics
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [periodIncome, setPeriodIncome] = useState<number>(0);
  const [periodExpenses, setPeriodExpenses] = useState<number>(0);
  const [periodNet, setPeriodNet] = useState<number>(0);
  const [topCategories, setTopCategories] = useState<CategorySpendingSummary[]>([]);
  const [accountExpenses, setAccountExpenses] = useState<AccountSpendingSummary[]>([]);
  const [recentActivities, setRecentActivities] = useState<DbActivityItem[]>([]);

  // Modals & Toast State
  const [isQuickAddAccountOpen, setIsQuickAddAccountOpen] = useState(false);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<Transaction | null>(null);
  const [selectedTransferForDetail, setSelectedTransferForDetail] = useState<Transfer | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Account creation form state
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<AccountType>('bank');
  const [accOpeningBal, setAccOpeningBal] = useState('0');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currencySymbol = profile?.currencySymbol || '₹';
  const userName = profile?.name || 'Developer';

  const getGreeting = (name: string) => {
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 18) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  const activeAccounts = accounts.filter((a) => a.isActive);
  const selectedAccount = selectedAccountId === 'ALL' ? null : activeAccounts.find((a) => a.id === selectedAccountId);

  // Total balance display
  const displayedBalance = selectedAccount
    ? selectedAccount.currentBalance
    : activeAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

  // Query SQLite aggregate metrics directly
  const fetchDashboardMetrics = useCallback(async () => {
    setIsLoadingMetrics(true);
    setHasError(false);

    try {
      let startDate: string | undefined;
      let endDate: string | undefined;

      if (period === 'custom') {
        if (customStart && customEnd && customStart <= customEnd) {
          startDate = customStart;
          endDate = customEnd;
        } else {
          const range = getDateRange('month');
          startDate = range.startISO;
          endDate = range.endISO;
        }
      } else {
        const range = getDateRange(period);
        startDate = range.startISO;
        endDate = range.endISO;
      }

      const filter = {
        accountId: selectedAccountId,
        startDate,
        endDate,
      };

      const [inc, exp, net, topCat, accExp, recentAct] = await Promise.all([
        dbManager.transactions.getPeriodIncome(filter),
        dbManager.transactions.getPeriodExpenses(filter),
        dbManager.transactions.getPeriodNet(filter),
        dbManager.transactions.getTopExpenseCategories({ ...filter, limit: 5 }),
        dbManager.transactions.getAccountExpenses({ startDate, endDate }),
        dbManager.transactions.getRecentActivity({ accountId: selectedAccountId, limit: 6 }),
      ]);

      setPeriodIncome(inc);
      setPeriodExpenses(exp);
      setPeriodNet(net);
      setTopCategories(topCat);
      setAccountExpenses(accExp);
      setRecentActivities(recentAct);
    } catch (err) {
      console.error('Error loading dashboard SQL metrics:', err);
      setHasError(true);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [period, customStart, customEnd, selectedAccountId]);

  useEffect(() => {
    fetchDashboardMetrics();
  }, [fetchDashboardMetrics, transactions, transfers, accounts]);

  const handleRefresh = async () => {
    await initApp();
    await fetchDashboardMetrics();
    setToastMessage('PocketDB ledger synchronized');
  };

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

  const handleOpenTransaction = (type: 'income' | 'expense') => {
    setEditingTransaction(null);
    setTransactionType(type);
    setIsTransactionFormOpen(true);
  };

  const handleQuickAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) {
      setFormError('Account name is required.');
      return;
    }
    const paise = parseCurrencyInput(accOpeningBal);
    if (isNaN(paise)) {
      setFormError('Invalid opening balance amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addAccount({
        name: accName.trim(),
        type: accType,
        openingBalance: paise,
        currentBalance: paise,
        isActive: true,
        color: '#3B82F6',
        icon: 'Wallet',
      });
      setIsQuickAddAccountOpen(false);
      setAccName('');
      setAccOpeningBal('0');
      setToastMessage('Ledger account created successfully');
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Toast Feedback */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Greeting Banner */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-mono font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
            PocketDB Console
          </p>
          <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">
            {getGreeting(userName)}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRefresh}
            title="Reload SQLite Metrics"
            className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingMetrics ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={() => setIsQuickAddAccountOpen(true)}
            className="flex items-center gap-1.5 py-2 px-3 bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border border-blue-200 dark:border-blue-800"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Account</span>
          </button>
        </div>
      </div>

      {/* Main Balance Hero Card with PocketDB Identity */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800 relative overflow-hidden"
      >
        <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
          <PocketDbLogo size={120} variant="icon-only" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase font-bold tracking-widest text-slate-300">
              {selectedAccount ? `${selectedAccount.name} Balance` : 'Net Worth (All Accounts)'}
            </span>
            <span className="text-[10px] font-mono font-bold bg-blue-950/80 px-2.5 py-0.5 rounded-full text-blue-300 border border-blue-800/80">
              SQLite v1.0
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
            {formatCurrency(displayedBalance, currencySymbol)}
          </h2>

          {/* Quick Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => handleOpenTransaction('expense')}
              className="flex-1 py-2.5 px-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 active:scale-95 transition-all rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 border border-rose-500/30 shadow-xs cursor-pointer"
            >
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span>+ Expense</span>
            </button>
            <button
              onClick={() => handleOpenTransaction('income')}
              className="flex-1 py-2.5 px-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 active:scale-95 transition-all rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 border border-emerald-500/30 shadow-xs cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>+ Income</span>
            </button>
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="flex-1 py-2.5 px-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 active:scale-95 transition-all rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 border border-indigo-500/30 shadow-xs cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
              <span>↔ Transfer</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Account Selection Filter */}
      <div className="flex items-center justify-between gap-2 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-xs font-mono font-bold text-gray-700 dark:text-slate-300">Account Scope:</span>
        </div>
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="ALL">All Accounts ({activeAccounts.length})</option>
          {activeAccounts.map((acc) => (
            <option key={acc.id} value={acc.id} className="bg-slate-900 text-white">
              {acc.name} ({formatCurrency(acc.currentBalance, currencySymbol)})
            </option>
          ))}
        </select>
      </div>

      {/* Period Selector & Financial Summary */}
      <div className="space-y-3">
        <PeriodSelector
          period={period}
          onChangePeriod={(p) => setPeriod(p)}
          customStartDate={customStart}
          customEndDate={customEnd}
          onChangeCustomDates={(start, end) => {
            setCustomStart(start);
            setCustomEnd(end);
          }}
        />

        {hasError ? (
          <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl flex items-center justify-between text-xs text-red-600 dark:text-red-400 font-bold font-mono">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Failed to execute SQLite aggregate query.</span>
            </div>
            <button
              onClick={fetchDashboardMetrics}
              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          <SummaryCard
            income={periodIncome}
            expenses={periodExpenses}
            net={periodNet}
            currencySymbol={currencySymbol}
          />
        )}
      </div>

      {/* Top Expense Categories */}
      <TopCategoriesCard
        categories={topCategories}
        totalPeriodExpenses={periodExpenses}
        currencySymbol={currencySymbol}
      />

      {/* Account-Wise Spending */}
      {selectedAccountId === 'ALL' && (
        <AccountSpendingCard
          accountExpenses={accountExpenses}
          currencySymbol={currencySymbol}
        />
      )}

      {/* Accounts List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold text-gray-900 dark:text-slate-300 uppercase tracking-wider">
            Ledger Accounts ({activeAccounts.length})
          </h3>
          <button
            onClick={() => setActiveTab('accounts')}
            className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
          >
            <span>Manage</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeAccounts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 text-center border border-gray-100 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl mx-auto flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white font-mono">No Active Accounts</h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xs mx-auto">
                No bank data is imported automatically. PocketDB gives you complete manual control.
              </p>
            </div>
            <button
              onClick={() => setIsQuickAddAccountOpen(true)}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-mono font-bold shadow-md inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Account</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeAccounts.map((acc) => (
              <div
                key={acc.id}
                onClick={() => setSelectedAccount(acc.id)}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer group ${
                  selectedAccountId === acc.id
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 shadow-2xs hover:border-blue-200 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-xl group-hover:scale-105 transition-transform">
                    {getAccountIconComponent(acc.type)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {acc.name}
                    </h4>
                    <p className="text-[11px] text-gray-400 dark:text-slate-400 font-medium capitalize font-mono">
                      {ACCOUNT_TYPE_LABELS[acc.type]}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-black font-mono text-gray-900 dark:text-white">
                    {formatCurrency(acc.currentBalance, currencySymbol)}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono">Balance</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Ledger Activity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold text-gray-900 dark:text-slate-300 uppercase tracking-wider">
            Recent Ledger Entries
          </h3>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
          >
            <span>Full Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentActivities.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 text-center border border-gray-100 dark:border-slate-800 space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl w-12 h-12 mx-auto flex items-center justify-center">
              <ReceiptText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white font-mono">Your ledger is empty</h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xs mx-auto">
                Add your first income or expense to start building your financial history.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={() => handleOpenTransaction('expense')}
                className="px-3.5 py-2 bg-rose-600 text-white rounded-xl text-xs font-mono font-bold shadow-md hover:bg-rose-700 transition-colors cursor-pointer"
              >
                + Add Expense
              </button>
              <button
                onClick={() => handleOpenTransaction('income')}
                className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-mono font-bold shadow-md hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                + Add Income
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivities.map((item) => {
              if (item.kind === 'transaction') {
                const category = categories.find((c) => c.id === item.categoryId);
                const account = accounts.find((a) => a.id === item.accountId);
                const { formattedDate } = extractDateAndTime(item.date);

                const txObj: Transaction = {
                  id: item.id,
                  accountId: item.accountId,
                  type: item.type === 'income' ? 'income' : 'expense',
                  amount: item.amount,
                  categoryId: item.categoryId || '',
                  note: item.note,
                  date: item.date,
                  createdAt: item.createdAt,
                  updatedAt: item.createdAt,
                };

                return (
                  <div
                    key={`act_tx_${item.id}`}
                    onClick={() => setSelectedTxForDetail(txObj)}
                    className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-2xs flex items-center justify-between hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${category?.color || '#3B82F6'}20` }}
                      >
                        <CategoryIcon
                          name={category?.icon || 'Tag'}
                          color={category?.color || '#3B82F6'}
                          className="w-4 h-4"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
                          {item.note || category?.name || item.type.toUpperCase()}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate font-mono">
                          {category?.name || 'Uncategorized'} • {account?.name || 'Account'} • {formattedDate}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`text-xs font-black font-mono ${
                          item.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {item.type === 'income' ? '+' : '-'}
                        {formatCurrency(item.amount, currencySymbol)}
                      </p>
                    </div>
                  </div>
                );
              } else {
                const fromAcc = accounts.find((a) => a.id === item.accountId);
                const toAcc = accounts.find((a) => a.id === item.toAccountId);
                const { formattedDate } = extractDateAndTime(item.date);

                const trObj: Transfer = {
                  id: item.id,
                  fromAccountId: item.accountId,
                  toAccountId: item.toAccountId || '',
                  amount: item.amount,
                  note: item.note,
                  date: item.date,
                  createdAt: item.createdAt,
                  updatedAt: item.createdAt,
                };

                return (
                  <div
                    key={`act_tr_${item.id}`}
                    onClick={() => setSelectedTransferForDetail(trObj)}
                    className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-950/60 shadow-2xs flex items-center justify-between hover:border-indigo-300 dark:hover:border-indigo-600 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <ArrowLeftRight className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
                          {item.note || 'Account Transfer'}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate flex items-center gap-1 font-mono">
                          <span>{fromAcc?.name || 'Source'}</span>
                          <ArrowRight className="w-3 h-3 text-indigo-400 inline shrink-0" />
                          <span>{toAcc?.name || 'Dest'}</span>
                          <span>• {formattedDate}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(item.amount, currencySymbol)}
                      </span>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>

      {/* QUICK ADD ACCOUNT MODAL */}
      {isQuickAddAccountOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 space-y-4 border border-gray-100 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setIsQuickAddAccountOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-gray-900 dark:text-white font-mono">
              Create Ledger Account
            </h3>

            {formError && (
              <div className="p-3 bg-red-50 text-red-600 dark:bg-red-950/50 text-xs rounded-xl font-medium font-mono">
                {formError}
              </div>
            )}

            <form onSubmit={handleQuickAddAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-bold text-gray-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Account Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cash, HDFC Savings, ICICI"
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-mono font-medium text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-gray-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Account Type
                </label>
                <select
                  value={accType}
                  onChange={(e) => setAccType(e.target.value as AccountType)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-mono font-semibold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key} className="bg-slate-900 text-white">
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-gray-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                  Opening Balance ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={accOpeningBal}
                  onChange={(e) => setAccOpeningBal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-mono font-medium text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickAddAccountOpen(false)}
                  className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-200 text-xs font-mono font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSACTION FORM MODAL */}
      <TransactionFormModal
        isOpen={isTransactionFormOpen}
        onClose={() => setIsTransactionFormOpen(false)}
        defaultType={transactionType}
        initialTransaction={editingTransaction}
        onSuccess={(msg) => setToastMessage(msg)}
      />

      {/* TRANSACTION DETAIL MODAL */}
      <TransactionDetailModal
        isOpen={!!selectedTxForDetail}
        transaction={selectedTxForDetail}
        onClose={() => setSelectedTxForDetail(null)}
        onEdit={(txToEdit) => {
          setEditingTransaction(txToEdit);
          setIsTransactionFormOpen(true);
        }}
        onSuccessToast={(msg) => setToastMessage(msg)}
      />

      {/* TRANSFER FORM MODAL */}
      <TransferFormModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
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
