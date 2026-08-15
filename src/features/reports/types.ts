export type ReportPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface ReportFilter {
  period: ReportPeriod;
  accountId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ReportSummary {
  income: number;
  expenses: number;
  net: number;
  savingsRate: number | null; // null if income is 0
  avgDailyExpense: number;
  totalDays: number;
  highestSpendingDay: { date: string; amount: number } | null;
}

export interface IncomeVsExpenseTrendPoint {
  label: string;
  date: string;
  income: number;
  expense: number;
}

export interface CategoryReportItem {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  percentage: number;
}

export interface TopExpenseItem {
  id: string;
  note?: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  accountId: string;
  accountName: string;
  amount: number;
  date: string;
}

export interface AccountReportItem {
  accountId: string;
  accountName: string;
  accountType: string;
  accountIcon: string;
  accountColor: string;
  expenses: number;
  income: number;
}

export interface MonthComparison {
  currentMonthExpenses: number;
  prevMonthExpenses: number;
  expenseDiffPct: number | null;
  currentMonthIncome: number;
  prevMonthIncome: number;
  incomeDiffPct: number | null;
}

export interface YearComparison {
  currentYearExpenses: number;
  prevYearExpenses: number;
  expenseDiffPct: number | null;
  currentYearIncome: number;
  prevYearIncome: number;
  incomeDiffPct: number | null;
  currentYearNet: number;
  prevYearNet: number;
  netDiffPct: number | null;
}

export interface FinancialInsight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'info';
  title: string;
  description: string;
}

export interface FullReportData {
  summary: ReportSummary;
  trendPoints: IncomeVsExpenseTrendPoint[];
  expenseCategories: CategoryReportItem[];
  incomeCategories: CategoryReportItem[];
  topExpenses: TopExpenseItem[];
  accountBreakdown: AccountReportItem[];
  monthComparison: MonthComparison | null;
  yearComparison: YearComparison | null;
  insights: FinancialInsight[];
}
