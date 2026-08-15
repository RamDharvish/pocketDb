export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export type AccountType = 'bank' | 'cash' | 'wallet' | 'credit_card' | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number; // Stored in minor units (e.g. paise/cents)
  currentBalance: number; // Stored in minor units
  icon: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number; // Positive value in minor units (paise)
  categoryId?: string; // Optional for transfers
  transferId?: string; // Links both sides of transfer
  destinationAccountId?: string; // For transfer record reference
  note?: string;
  date: string; // ISO 8601 string or YYYY-MM-DD
  time?: string; // HH:mm format
  createdAt: string;
  updatedAt: string;
}

export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number; // Stored in minor units (paise)
  note?: string;
  date: string; // ISO 8601 string or YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface BalanceAdjustment {
  id: string;
  accountId: string;
  previousBalance: number; // in minor units
  newBalance: number; // in minor units
  adjustmentAmount: number; // difference in minor units
  reason?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  currency: CurrencyCode;
  currencySymbol: string;
  isOnboarded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: string; // "19:00" format (07:00 PM)
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: ThemeMode;
  notifications: NotificationSettings;
}

export interface BackupData {
  backupVersion: number;
  appVersion: string;
  exportedAt: string;
  profile: UserProfile;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  adjustments: BalanceAdjustment[];
  settings: AppSettings;
}

export type DateRangeType = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';

export interface DateFilter {
  type: DateRangeType;
  startDate?: string;
  endDate?: string;
}
