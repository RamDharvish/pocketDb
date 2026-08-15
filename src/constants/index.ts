import { Category, CurrencyConfig } from '../types';

export const APP_VERSION = '1.0.0';
export const BACKUP_VERSION = 1;

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥)' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (A$)' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar (C$)' },
];

export const DEFAULT_CURRENCY = SUPPORTED_CURRENCIES[0];

export const ACCOUNT_TYPE_LABELS = {
  bank: 'Bank Account',
  cash: 'Cash',
  wallet: 'Digital Wallet',
  credit_card: 'Credit Card',
  other: 'Other Account',
} as const;

export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#EF4444', isDefault: true, isActive: true },
  { name: 'Groceries', type: 'expense', icon: 'ShoppingBag', color: '#F97316', isDefault: true, isActive: true },
  { name: 'Shopping', type: 'expense', icon: 'ShoppingCart', color: '#EC4899', isDefault: true, isActive: true },
  { name: 'Transport', type: 'expense', icon: 'Bus', color: '#3B82F6', isDefault: true, isActive: true },
  { name: 'Fuel', type: 'expense', icon: 'Fuel', color: '#0EA5E9', isDefault: true, isActive: true },
  { name: 'Bills & Utilities', type: 'expense', icon: 'Receipt', color: '#8B5CF6', isDefault: true, isActive: true },
  { name: 'Rent', type: 'expense', icon: 'Home', color: '#6366F1', isDefault: true, isActive: true },
  { name: 'EMI & Loans', type: 'expense', icon: 'Landmark', color: '#D97706', isDefault: true, isActive: true },
  { name: 'Healthcare', type: 'expense', icon: 'HeartPulse', color: '#10B981', isDefault: true, isActive: true },
  { name: 'Education', type: 'expense', icon: 'GraduationCap', color: '#14B8A6', isDefault: true, isActive: true },
  { name: 'Entertainment', type: 'expense', icon: 'Film', color: '#A855F7', isDefault: true, isActive: true },
  { name: 'Travel', type: 'expense', icon: 'Plane', color: '#06B6D4', isDefault: true, isActive: true },
  { name: 'Insurance', type: 'expense', icon: 'ShieldCheck', color: '#059669', isDefault: true, isActive: true },
  { name: 'Investment', type: 'expense', icon: 'TrendingUp', color: '#16A34A', isDefault: true, isActive: true },
  { name: 'Other Expense', type: 'expense', icon: 'MoreHorizontal', color: '#6B7280', isDefault: true, isActive: true },
];

export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Salary', type: 'income', icon: 'Briefcase', color: '#10B981', isDefault: true, isActive: true },
  { name: 'Freelance', type: 'income', icon: 'Laptop', color: '#3B82F6', isDefault: true, isActive: true },
  { name: 'Business', type: 'income', icon: 'Building2', color: '#6366F1', isDefault: true, isActive: true },
  { name: 'Bonus', type: 'income', icon: 'Award', color: '#F59E0B', isDefault: true, isActive: true },
  { name: 'Interest', type: 'income', icon: 'Percent', color: '#8B5CF6', isDefault: true, isActive: true },
  { name: 'Gift', type: 'income', icon: 'Gift', color: '#EC4899', isDefault: true, isActive: true },
  { name: 'Refund', type: 'income', icon: 'RotateCcw', color: '#14B8A6', isDefault: true, isActive: true },
  { name: 'Other Income', type: 'income', icon: 'PlusCircle', color: '#10B981', isDefault: true, isActive: true },
];

export const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: true,
  reminderTime: '19:00', // 7:00 PM
};

export const DEFAULT_APP_SETTINGS = {
  theme: 'system' as const,
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
};
