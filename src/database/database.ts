/**
 * Centralized Database Manager (Phase 2 SQLite Foundation)
 * Orchestrates SQLite initialization, migrations, seeding, queries, and backup/restore operations.
 */

import { DatabaseEngine } from './databaseEngine';
import { runMigrations } from './migrations';
import { seedDefaultCategories } from './seed';
import * as userQueries from './queries/userQueries';
import * as accountQueries from './queries/accountQueries';
import * as categoryQueries from './queries/categoryQueries';
import * as transactionQueries from './queries/transactionQueries';
import * as transferQueries from './queries/transferQueries';
import * as balanceAdjustmentQueries from './queries/balanceAdjustmentQueries';
import * as settingsQueries from './queries/settingsQueries';
import * as reportQueries from './queries/reportQueries';

class DatabaseManager {
  private engine: DatabaseEngine;
  private isInitialized = false;

  constructor() {
    this.engine = new DatabaseEngine('expense_tracker.db');
  }

  public get db(): DatabaseEngine {
    return this.engine;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 1. Run migrations
    await runMigrations(this.engine);

    // 2. Seed default categories if empty
    await seedDefaultCategories(this.engine);

    this.isInitialized = true;
  }

  public async completeOnboarding(
    name: string,
    currency: string,
    accountName: string,
    accountType: accountQueries.DbAccount['type'],
    openingBalance: number
  ): Promise<void> {
    await this.engine.transaction(async () => {
      await userQueries.createUser(this.engine, name, currency);
      await accountQueries.createAccount(this.engine, {
        name: accountName,
        type: accountType,
        opening_balance: openingBalance,
      });
      await settingsQueries.setSetting(this.engine, 'onboarding_completed', 'true');
    });
  }

  // --- QUERIES FACADE ---
  public user = {
    get: () => userQueries.getUser(this.engine),
    create: (name: string, currency: string) => userQueries.createUser(this.engine, name, currency),
    update: (name: string, currency: string) => userQueries.updateUser(this.engine, name, currency),
  };

  public accounts = {
    getAll: (includeArchived = false) => accountQueries.getAccounts(this.engine, includeArchived),
    getById: (id: string) => accountQueries.getAccountById(this.engine, id),
    create: (account: Parameters<typeof accountQueries.createAccount>[1]) =>
      accountQueries.createAccount(this.engine, account),
    update: (id: string, data: Parameters<typeof accountQueries.updateAccount>[2]) =>
      accountQueries.updateAccount(this.engine, id, data),
    archive: (id: string) => accountQueries.archiveAccount(this.engine, id),
    deleteSafely: (id: string) => accountQueries.deleteAccountSafely(this.engine, id),
    hasHistory: (id: string) => accountQueries.hasFinancialHistory(this.engine, id),
    getBalance: (id: string) => accountQueries.getAccountBalance(this.engine, id),
    getTotalBalance: () => accountQueries.getTotalBalance(this.engine),
  };

  public categories = {
    getAll: (includeArchived = false) => categoryQueries.getCategories(this.engine, includeArchived),
    getIncome: () => categoryQueries.getIncomeCategories(this.engine),
    getExpense: () => categoryQueries.getExpenseCategories(this.engine),
    create: (cat: Parameters<typeof categoryQueries.createCategory>[1]) => categoryQueries.createCategory(this.engine, cat),
    update: (id: string, data: Parameters<typeof categoryQueries.updateCategory>[2]) =>
      categoryQueries.updateCategory(this.engine, id, data),
    archive: (id: string) => categoryQueries.archiveCategory(this.engine, id),
  };

  public transactions = {
    getAll: (filter?: Parameters<typeof transactionQueries.getTransactions>[1]) =>
      transactionQueries.getTransactions(this.engine, filter),
    getById: (id: string) => transactionQueries.getTransactionById(this.engine, id),
    getIncomeTotal: (filter?: Parameters<typeof transactionQueries.getIncomeTotal>[1]) =>
      transactionQueries.getIncomeTotal(this.engine, filter),
    getExpenseTotal: (filter?: Parameters<typeof transactionQueries.getExpenseTotal>[1]) =>
      transactionQueries.getExpenseTotal(this.engine, filter),
    getPeriodIncome: (filter?: Parameters<typeof transactionQueries.getPeriodIncome>[1]) =>
      transactionQueries.getPeriodIncome(this.engine, filter),
    getPeriodExpenses: (filter?: Parameters<typeof transactionQueries.getPeriodExpenses>[1]) =>
      transactionQueries.getPeriodExpenses(this.engine, filter),
    getPeriodNet: (filter?: Parameters<typeof transactionQueries.getPeriodNet>[1]) =>
      transactionQueries.getPeriodNet(this.engine, filter),
    getTopExpenseCategories: (filter?: Parameters<typeof transactionQueries.getTopExpenseCategories>[1]) =>
      transactionQueries.getTopExpenseCategories(this.engine, filter),
    getAccountExpenses: (filter?: Parameters<typeof transactionQueries.getAccountExpenses>[1]) =>
      transactionQueries.getAccountExpenses(this.engine, filter),
    getAccountIncome: (filter?: Parameters<typeof transactionQueries.getAccountIncome>[1]) =>
      transactionQueries.getAccountIncome(this.engine, filter),
    getRecentActivity: (filter?: Parameters<typeof transactionQueries.getRecentActivity>[1]) =>
      transactionQueries.getRecentActivity(this.engine, filter),
    create: (tx: Parameters<typeof transactionQueries.createTransaction>[1]) =>
      transactionQueries.createTransaction(this.engine, tx),
    update: (id: string, data: Parameters<typeof transactionQueries.updateTransaction>[2]) =>
      transactionQueries.updateTransaction(this.engine, id, data),
    delete: (id: string) => transactionQueries.deleteTransaction(this.engine, id),
  };

  public transfers = {
    getAll: (accountId?: string) => transferQueries.getTransfers(this.engine, accountId),
    getById: (id: string) => transferQueries.getTransferById(this.engine, id),
    create: (trf: Parameters<typeof transferQueries.createTransfer>[1]) =>
      transferQueries.createTransfer(this.engine, trf),
    update: (id: string, data: Parameters<typeof transferQueries.updateTransfer>[2]) =>
      transferQueries.updateTransfer(this.engine, id, data),
    delete: (id: string) => transferQueries.deleteTransfer(this.engine, id),
    getByAccount: (accountId: string) => transferQueries.getTransfersByAccount(this.engine, accountId),
    getByDateRange: (startDate: string, endDate: string, accountId?: string) =>
      transferQueries.getTransfersByDateRange(this.engine, startDate, endDate, accountId),
    search: (query: string, accountId?: string) => transferQueries.searchTransfers(this.engine, query, accountId),
  };

  public adjustments = {
    getAll: (accountId?: string) => balanceAdjustmentQueries.getBalanceAdjustments(this.engine, accountId),
    create: (adj: Parameters<typeof balanceAdjustmentQueries.createBalanceAdjustment>[1]) =>
      balanceAdjustmentQueries.createBalanceAdjustment(this.engine, adj),
    delete: (id: string) => balanceAdjustmentQueries.deleteBalanceAdjustment(this.engine, id),
  };

  public settings = {
    get: (key: string) => settingsQueries.getSetting(this.engine, key),
    set: (key: string, value: string) => settingsQueries.setSetting(this.engine, key, value),
    getNotifications: () => settingsQueries.getNotificationSettings(this.engine),
    updateNotifications: (enabled: boolean, time: string) =>
      settingsQueries.updateNotificationSettings(this.engine, enabled, time),
  };

  public reports = {
    getSummary: (filter: Parameters<typeof reportQueries.getReportSummary>[1]) =>
      reportQueries.getReportSummary(this.engine, filter),
    getTrendPoints: (
      filter: Parameters<typeof reportQueries.getTrendPoints>[1],
      period: Parameters<typeof reportQueries.getTrendPoints>[2]
    ) => reportQueries.getTrendPoints(this.engine, filter, period),
    getCategoryReport: (
      filter: Parameters<typeof reportQueries.getCategoryReport>[1],
      type: Parameters<typeof reportQueries.getCategoryReport>[2]
    ) => reportQueries.getCategoryReport(this.engine, filter, type),
    getTopExpenses: (
      filter: Parameters<typeof reportQueries.getTopExpenseItems>[1],
      limit?: number
    ) => reportQueries.getTopExpenseItems(this.engine, filter, limit),
    getAccountReport: (filter: Parameters<typeof reportQueries.getAccountReport>[1]) =>
      reportQueries.getAccountReport(this.engine, filter),
    getMonthComparison: (accountId?: string) => reportQueries.getMonthComparison(this.engine, accountId),
    getYearComparison: (accountId?: string) => reportQueries.getYearComparison(this.engine, accountId),
    getFullData: (
      filter: Parameters<typeof reportQueries.fetchFullReportData>[1],
      currencySymbol?: string
    ) => reportQueries.fetchFullReportData(this.engine, filter, currencySymbol),
  };

  public async resetAllData(): Promise<void> {
    this.engine.clearAll();
    this.isInitialized = false;
    await this.initialize();
  }
}

export const dbManager = new DatabaseManager();
