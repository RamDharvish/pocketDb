import { create } from 'zustand';
import {
  UserProfile,
  Account,
  Category,
  Transaction,
  Transfer,
  BalanceAdjustment,
  AppSettings,
  DateFilter,
  CurrencyCode,
} from '../types';
import { dbManager } from '../database/database';
import { verifyDatabase, VerificationResult } from '../database/verify';
import { DEFAULT_APP_SETTINGS } from '../constants';
import { syncDailyReminder } from '../utils/notificationService';

interface AppState {
  isInitialized: boolean;
  profile: UserProfile | null;
  accounts: Account[];
  selectedAccountId: string | 'ALL';
  categories: Category[];
  transactions: Transaction[];
  transfers: Transfer[];
  adjustments: BalanceAdjustment[];
  settings: AppSettings;
  dateFilter: DateFilter;
  activeTab: 'dashboard' | 'transactions' | 'accounts' | 'reports' | 'settings';
  verificationResults: VerificationResult[];

  // Actions
  initApp: () => Promise<void>;
  setOnboarding: (name: string, currency: CurrencyCode, firstAccountName: string, accountType: Account['type'], openingBalancePaise: number) => Promise<void>;
  updateUserProfile: (name: string, currency: CurrencyCode) => Promise<void>;
  setSelectedAccount: (accountId: string | 'ALL') => void;
  setActiveTab: (tab: AppState['activeTab']) => void;
  setDateFilter: (filter: DateFilter) => void;

  // Account Operations
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAccount: (account: Account) => Promise<void>;
  archiveAccount: (accountId: string) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<{ success: boolean; message?: string }>;
  adjustBalance: (accountId: string, newBalancePaise: number, reason?: string) => Promise<void>;

  // Category Operations
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCategory: (id: string, data: Partial<Pick<Category, 'name' | 'icon' | 'color'>>) => Promise<void>;
  archiveCategory: (categoryId: string) => Promise<void>;

  // Transaction Operations
  addIncomeExpense: (tx: { accountId: string; type: 'income' | 'expense'; amount: number; categoryId: string; note?: string; date: string; time?: string }) => Promise<void>;
  updateTransaction: (tx: { id: string; accountId: string; type: 'income' | 'expense'; amount: number; categoryId: string; note?: string; date: string; time?: string }) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Transfer Operations
  addTransfer: (transfer: { sourceAccountId: string; destinationAccountId: string; amount: number; note?: string; date: string; time?: string }) => Promise<void>;
  updateTransfer: (transfer: { id: string; sourceAccountId: string; destinationAccountId: string; amount: number; note?: string; date: string; time?: string }) => Promise<void>;
  deleteTransfer: (id: string) => Promise<void>;

  // Settings & Data Management
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  importData: (jsonData: string) => Promise<boolean>;
  exportData: () => Promise<string>;
  resetApp: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  isInitialized: false,
  profile: null,
  accounts: [],
  selectedAccountId: 'ALL',
  categories: [],
  transactions: [],
  transfers: [],
  adjustments: [],
  settings: DEFAULT_APP_SETTINGS,
  dateFilter: { type: 'month' },
  activeTab: 'dashboard',
  verificationResults: [],

  initApp: async () => {
    // 1. Initialize SQLite Database Engine, run migrations, and seed default categories
    await dbManager.initialize();

    // 2. Run Database Foundation Verification Suite
    const vResults = await verifyDatabase();

    // 3. Load DB data
    const dbUser = await dbManager.user.get();
    const dbAccounts = await dbManager.accounts.getAll(false);
    const dbCategories = await dbManager.categories.getAll(false);
    const dbTransactions = await dbManager.transactions.getAll();
    const dbTransfers = await dbManager.transfers.getAll();
    const dbAdjustments = await dbManager.adjustments.getAll();
    const notificationSettings = await dbManager.settings.getNotifications();
    const onboardingCompleted = await dbManager.settings.get('onboarding_completed');
    const savedSelectedAccountId = await dbManager.settings.get('selected_account_id');
    const savedTheme = (await dbManager.settings.get('app_theme')) as 'light' | 'dark' | 'system' | null;

    const profile: UserProfile | null =
      dbUser && onboardingCompleted === 'true'
        ? {
            id: dbUser.id,
            name: dbUser.name,
            currency: dbUser.currency as CurrencyCode,
            currencySymbol:
              { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$' }[dbUser.currency] || '₹',
            isOnboarded: true,
            createdAt: dbUser.created_at,
            updatedAt: dbUser.updated_at,
          }
        : null;

    // Calculate derived balance using SQL aggregation for each account
    const mappedAccounts: Account[] = [];
    for (const acc of dbAccounts) {
      const derivedBalance = await dbManager.accounts.getBalance(acc.id);
      mappedAccounts.push({
        id: acc.id,
        name: acc.name,
        type: acc.type,
        openingBalance: acc.opening_balance,
        currentBalance: derivedBalance,
        icon: acc.icon,
        color: acc.color,
        isActive: acc.is_active === 1,
        createdAt: acc.created_at,
        updatedAt: acc.updated_at,
      });
    }

    let activeSelectedAcc = savedSelectedAccountId || get().selectedAccountId || 'ALL';
    if (activeSelectedAcc !== 'ALL' && !mappedAccounts.some((a) => a.id === activeSelectedAcc)) {
      activeSelectedAcc = 'ALL';
    }

    const mappedCategories: Category[] = dbCategories.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      icon: c.icon,
      color: c.color,
      isDefault: c.is_default === 1,
      isActive: c.is_active === 1,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    const mappedTransactions: Transaction[] = dbTransactions.map((t) => ({
      id: t.id,
      accountId: t.account_id,
      type: t.type,
      amount: t.amount,
      categoryId: t.category_id,
      note: t.note || undefined,
      date: t.transaction_date,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));

    const mappedTransfers: Transfer[] = dbTransfers.map((tr) => ({
      id: tr.id,
      fromAccountId: tr.from_account_id,
      toAccountId: tr.to_account_id,
      amount: tr.amount,
      note: tr.note || undefined,
      date: tr.transfer_date,
      createdAt: tr.created_at,
      updatedAt: tr.updated_at,
    }));

    const mappedAdjustments: BalanceAdjustment[] = dbAdjustments.map((a) => ({
      id: a.id,
      accountId: a.account_id,
      previousBalance: 0,
      newBalance: a.amount,
      adjustmentAmount: a.amount,
      reason: a.reason || undefined,
      createdAt: a.created_at,
    }));

    const isNotifEnabled = notificationSettings.enabled === 1;
    const notifTime = notificationSettings.reminder_time || '20:00';

    await syncDailyReminder(isNotifEnabled, notifTime);

    set({
      isInitialized: true,
      profile,
      accounts: mappedAccounts,
      selectedAccountId: activeSelectedAcc,
      categories: mappedCategories,
      transactions: mappedTransactions,
      transfers: mappedTransfers,
      adjustments: mappedAdjustments,
      settings: {
        theme: savedTheme || 'system',
        notifications: {
          enabled: isNotifEnabled,
          reminderTime: notifTime,
        },
      },
      verificationResults: vResults,
    });
  },

  setOnboarding: async (name, currency, firstAccountName, accountType, openingBalancePaise) => {
    await dbManager.completeOnboarding(name, currency, firstAccountName, accountType, openingBalancePaise);
    await get().initApp();
  },

  updateUserProfile: async (name, currency) => {
    await dbManager.user.update(name, currency);
    await get().initApp();
  },

  setSelectedAccount: (accountId) => {
    set({ selectedAccountId: accountId });
    dbManager.settings.set('selected_account_id', accountId);
  },
  setActiveTab: (activeTab) => set({ activeTab }),
  setDateFilter: (dateFilter) => set({ dateFilter }),

  addAccount: async (accData) => {
    await dbManager.accounts.create({
      name: accData.name,
      type: accData.type,
      opening_balance: accData.openingBalance,
      icon: accData.icon,
      color: accData.color,
    });
    await get().initApp();
  },

  updateAccount: async (acc) => {
    const hasHistory = await dbManager.accounts.hasHistory(acc.id);
    if (hasHistory) {
      const existingAcc = await dbManager.accounts.getById(acc.id);
      if (existingAcc && existingAcc.opening_balance !== acc.openingBalance) {
        const diff = acc.openingBalance - existingAcc.opening_balance;
        const nowISO = new Date().toISOString().split('T')[0];
        await dbManager.adjustments.create({
          account_id: acc.id,
          amount: diff,
          reason: 'Opening Balance correction',
          adjustment_date: nowISO,
        });
      }
      await dbManager.accounts.update(acc.id, {
        name: acc.name,
        type: acc.type,
        icon: acc.icon,
        color: acc.color,
      });
    } else {
      await dbManager.accounts.update(acc.id, {
        name: acc.name,
        type: acc.type,
        opening_balance: acc.openingBalance,
        icon: acc.icon,
        color: acc.color,
      });
    }
    await get().initApp();
  },

  archiveAccount: async (accountId) => {
    await dbManager.accounts.archive(accountId);
    if (get().selectedAccountId === accountId) {
      get().setSelectedAccount('ALL');
    }
    await get().initApp();
  },

  deleteAccount: async (accountId) => {
    const res = await dbManager.accounts.deleteSafely(accountId);
    if (res.success) {
      if (get().selectedAccountId === accountId) {
        get().setSelectedAccount('ALL');
      }
      await get().initApp();
    }
    return res;
  },

  adjustBalance: async (accountId, newBalancePaise, reason) => {
    const currentBal = await dbManager.accounts.getBalance(accountId);
    const diff = newBalancePaise - currentBal;
    const nowISO = new Date().toISOString().split('T')[0];

    await dbManager.adjustments.create({
      account_id: accountId,
      amount: diff,
      reason,
      adjustment_date: nowISO,
    });

    await get().initApp();
  },

  addCategory: async (catData) => {
    await dbManager.categories.create({
      name: catData.name,
      type: catData.type,
      icon: catData.icon,
      color: catData.color,
    });
    await get().initApp();
  },

  updateCategory: async (id, data) => {
    await dbManager.categories.update(id, data);
    await get().initApp();
  },

  archiveCategory: async (categoryId) => {
    await dbManager.categories.archive(categoryId);
    await get().initApp();
  },

  addIncomeExpense: async ({ accountId, type, amount, categoryId, note, date, time }) => {
    // Format date & time into ISO / full timestamp string if time is provided
    let txDate = date;
    if (time && !date.includes('T')) {
      txDate = `${date}T${time}:00`;
    }
    await dbManager.transactions.create({
      account_id: accountId,
      category_id: categoryId,
      type,
      amount,
      note,
      transaction_date: txDate,
    });
    await get().initApp();
  },

  updateTransaction: async ({ id, accountId, type, amount, categoryId, note, date, time }) => {
    let txDate = date;
    if (time && !date.includes('T')) {
      txDate = `${date}T${time}:00`;
    }
    await dbManager.transactions.update(id, {
      account_id: accountId,
      category_id: categoryId,
      type,
      amount,
      note,
      transaction_date: txDate,
    });
    await get().initApp();
  },

  deleteTransaction: async (id) => {
    await dbManager.transactions.delete(id);
    await get().initApp();
  },

  addTransfer: async ({ sourceAccountId, destinationAccountId, amount, note, date, time }) => {
    if (sourceAccountId === destinationAccountId) {
      throw new Error('Source and destination accounts must be different.');
    }
    if (amount <= 0) {
      throw new Error('Transfer amount must be greater than zero.');
    }

    const sourceAcc = get().accounts.find((a) => a.id === sourceAccountId);
    const destAcc = get().accounts.find((a) => a.id === destinationAccountId);

    if (!sourceAcc || !sourceAcc.isActive || !destAcc || !destAcc.isActive) {
      throw new Error('Only active accounts can be selected for transfers.');
    }

    // Check available balance on source account
    const availableBalance = await dbManager.accounts.getBalance(sourceAccountId);
    if (amount > availableBalance) {
      throw new Error('Insufficient balance.');
    }

    let transferDate = date;
    if (time && !date.includes('T')) {
      transferDate = `${date}T${time}:00`;
    }

    await dbManager.transfers.create({
      from_account_id: sourceAccountId,
      to_account_id: destinationAccountId,
      amount,
      note: note ? note.trim() : undefined,
      transfer_date: transferDate,
    });

    await get().initApp();
  },

  updateTransfer: async ({ id, sourceAccountId, destinationAccountId, amount, note, date, time }) => {
    if (sourceAccountId === destinationAccountId) {
      throw new Error('Source and destination accounts must be different.');
    }
    if (amount <= 0) {
      throw new Error('Transfer amount must be greater than zero.');
    }

    const existing = await dbManager.transfers.getById(id);
    if (!existing) {
      throw new Error('Transfer not found.');
    }

    const sourceAcc = get().accounts.find((a) => a.id === sourceAccountId);
    const destAcc = get().accounts.find((a) => a.id === destinationAccountId);

    if (!sourceAcc || !destAcc) {
      throw new Error('Selected accounts could not be found.');
    }

    // Check available balance
    const currentBalance = await dbManager.accounts.getBalance(sourceAccountId);
    let maxAvailable = currentBalance;
    if (sourceAccountId === existing.from_account_id) {
      maxAvailable += existing.amount;
    }

    if (amount > maxAvailable) {
      throw new Error('Insufficient balance.');
    }

    let transferDate = date;
    if (time && !date.includes('T')) {
      transferDate = `${date}T${time}:00`;
    }

    await dbManager.transfers.update(id, {
      from_account_id: sourceAccountId,
      to_account_id: destinationAccountId,
      amount,
      note: note ? note.trim() : undefined,
      transfer_date: transferDate,
    });

    await get().initApp();
  },

  deleteTransfer: async (id) => {
    await dbManager.transfers.delete(id);
    await get().initApp();
  },

  updateSettings: async (newSettings) => {
    if (newSettings.theme !== undefined) {
      await dbManager.settings.set('app_theme', newSettings.theme);
      set((state) => ({
        settings: {
          ...state.settings,
          theme: newSettings.theme!,
        },
      }));
    }
    if (newSettings.notifications) {
      await dbManager.settings.updateNotifications(
        newSettings.notifications.enabled,
        newSettings.notifications.reminderTime
      );
      await syncDailyReminder(
        newSettings.notifications.enabled,
        newSettings.notifications.reminderTime
      );
      set((state) => ({
        settings: {
          ...state.settings,
          notifications: {
            ...state.settings.notifications,
            ...newSettings.notifications,
          },
        },
      }));
    }
  },

  exportData: async () => {
    const user = await dbManager.user.get();
    const accounts = await dbManager.accounts.getAll(true);
    const categories = await dbManager.categories.getAll(true);
    const transactions = await dbManager.transactions.getAll();
    const transfers = await dbManager.transfers.getAll();
    const adjustments = await dbManager.adjustments.getAll();
    const notifications = await dbManager.settings.getNotifications();

    const backup = {
      backupVersion: 1,
      appVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      user,
      accounts,
      categories,
      transactions,
      transfers,
      adjustments,
      notifications,
    };

    return JSON.stringify(backup, null, 2);
  },

  importData: async (jsonData) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed || typeof parsed !== 'object' || !parsed.backupVersion) return false;

      await dbManager.resetAllData();

      if (parsed.user) {
        await dbManager.db.execute(
          `INSERT OR REPLACE INTO users (id, name, currency, created_at, updated_at) VALUES (?, ?, ?, ?, ?);`,
          [
            parsed.user.id || `usr_${Date.now()}`,
            parsed.user.name,
            parsed.user.currency,
            parsed.user.created_at || new Date().toISOString(),
            new Date().toISOString(),
          ]
        );
        await dbManager.settings.set('onboarding_completed', 'true');
      }

      if (Array.isArray(parsed.accounts)) {
        for (const acc of parsed.accounts) {
          await dbManager.db.execute(
            `INSERT OR REPLACE INTO accounts (id, name, type, opening_balance, icon, color, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              acc.id,
              acc.name,
              acc.type,
              acc.opening_balance ?? 0,
              acc.icon || 'Wallet',
              acc.color || '#3B82F6',
              acc.is_active ?? 1,
              acc.created_at || new Date().toISOString(),
              acc.updated_at || new Date().toISOString(),
            ]
          );
        }
      }

      if (Array.isArray(parsed.categories)) {
        for (const cat of parsed.categories) {
          await dbManager.db.execute(
            `INSERT OR REPLACE INTO categories (id, name, type, icon, color, is_default, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              cat.id,
              cat.name,
              cat.type,
              cat.icon,
              cat.color,
              cat.is_default ?? 0,
              cat.is_active ?? 1,
              cat.created_at || new Date().toISOString(),
              cat.updated_at || new Date().toISOString(),
            ]
          );
        }
      }

      if (Array.isArray(parsed.transactions)) {
        for (const tx of parsed.transactions) {
          await dbManager.db.execute(
            `INSERT OR REPLACE INTO transactions (id, account_id, category_id, type, amount, note, transaction_date, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              tx.id,
              tx.account_id,
              tx.category_id,
              tx.type,
              tx.amount,
              tx.note || null,
              tx.transaction_date,
              tx.created_at || new Date().toISOString(),
              tx.updated_at || new Date().toISOString(),
            ]
          );
        }
      }

      if (Array.isArray(parsed.transfers)) {
        for (const trf of parsed.transfers) {
          await dbManager.db.execute(
            `INSERT OR REPLACE INTO transfers (id, from_account_id, to_account_id, amount, note, transfer_date, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              trf.id,
              trf.from_account_id,
              trf.to_account_id,
              trf.amount,
              trf.note || null,
              trf.transfer_date,
              trf.created_at || new Date().toISOString(),
              trf.updated_at || new Date().toISOString(),
            ]
          );
        }
      }

      if (Array.isArray(parsed.adjustments)) {
        for (const adj of parsed.adjustments) {
          await dbManager.db.execute(
            `INSERT OR REPLACE INTO balance_adjustments (id, account_id, amount, reason, adjustment_date, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?);`,
            [
              adj.id,
              adj.account_id,
              adj.amount,
              adj.reason || null,
              adj.adjustment_date,
              adj.created_at || new Date().toISOString(),
              adj.updated_at || new Date().toISOString(),
            ]
          );
        }
      }

      if (parsed.notifications) {
        await dbManager.db.execute(
          `INSERT OR REPLACE INTO notification_settings (id, enabled, reminder_time, created_at, updated_at)
           VALUES ('default_notification', ?, ?, ?, ?);`,
          [
            parsed.notifications.enabled ? 1 : 0,
            parsed.notifications.reminder_time || '19:00',
            parsed.notifications.created_at || new Date().toISOString(),
            new Date().toISOString(),
          ]
        );
      }

      await get().initApp();
      return true;
    } catch (err) {
      console.error('Import error:', err);
      return false;
    }
  },

  resetApp: async () => {
    await dbManager.resetAllData();
    set({
      profile: null,
      accounts: [],
      selectedAccountId: 'ALL',
      categories: [],
      transactions: [],
      adjustments: [],
    });
    await get().initApp();
  },
}));
