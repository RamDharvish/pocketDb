/**
 * PocketDB - Database Schema & Definitions
 * Phase 2 SQLite Foundation
 */

export const DATABASE_NAME = 'expense_tracker.db';
export const DATABASE_VERSION = 1;

export const CREATE_TABLES_SQL = [
  // Users Table
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  // Accounts Table
  `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bank', 'cash', 'wallet', 'credit_card', 'other')),
    opening_balance INTEGER NOT NULL DEFAULT 0,
    icon TEXT NOT NULL DEFAULT 'Wallet',
    color TEXT NOT NULL DEFAULT '#3B82F6',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  // Categories Table
  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  // Transactions Table (Income & Expense)
  `CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    note TEXT,
    transaction_date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
  );`,

  // Transfers Table (Inter-account movements)
  `CREATE TABLE IF NOT EXISTS transfers (
    id TEXT PRIMARY KEY,
    from_account_id TEXT NOT NULL,
    to_account_id TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    note TEXT,
    transfer_date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    CHECK (from_account_id <> to_account_id),
    FOREIGN KEY (from_account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE RESTRICT
  );`,

  // Balance Adjustments Table
  `CREATE TABLE IF NOT EXISTS balance_adjustments (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT,
    adjustment_date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT
  );`,

  // Settings Table (Key-Value)
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );`,

  // Notification Settings Table
  `CREATE TABLE IF NOT EXISTS notification_settings (
    id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 0,
    reminder_time TEXT NOT NULL DEFAULT '19:00',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`
];

export const CREATE_INDEXES_SQL = [
  `CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);`,

  `CREATE INDEX IF NOT EXISTS idx_transfers_from_account ON transfers(from_account_id);`,
  `CREATE INDEX IF NOT EXISTS idx_transfers_to_account ON transfers(to_account_id);`,
  `CREATE INDEX IF NOT EXISTS idx_transfers_date ON transfers(transfer_date);`,

  `CREATE INDEX IF NOT EXISTS idx_adjustments_account ON balance_adjustments(account_id);`,
  `CREATE INDEX IF NOT EXISTS idx_adjustments_date ON balance_adjustments(adjustment_date);`
];
