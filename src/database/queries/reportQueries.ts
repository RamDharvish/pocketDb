import { DatabaseEngine } from '../databaseEngine';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';
import {
  ReportPeriod,
  ReportSummary,
  IncomeVsExpenseTrendPoint,
  CategoryReportItem,
  TopExpenseItem,
  AccountReportItem,
  MonthComparison,
  YearComparison,
  FinancialInsight,
  FullReportData,
} from '../../features/reports/types';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

export async function getReportSummary(
  db: DatabaseEngine,
  filter: { accountId?: string; startDate: string; endDate: string }
): Promise<ReportSummary> {
  const accFilter = filter.accountId && filter.accountId !== 'ALL' ? filter.accountId : undefined;

  // Income Total
  let incSql = "SELECT SUM(amount) as total FROM transactions WHERE type = 'income'";
  const incParams: any[] = [];
  if (accFilter) {
    incSql += ' AND account_id = ?';
    incParams.push(accFilter);
  }
  if (filter.startDate) {
    incSql += ' AND transaction_date >= ?';
    incParams.push(filter.startDate);
  }
  if (filter.endDate) {
    const endStr = filter.endDate.length === 10 ? `${filter.endDate}T23:59:59` : filter.endDate;
    incSql += ' AND transaction_date <= ?';
    incParams.push(endStr);
  }
  const incRes = await db.querySingle<{ total: number }>(incSql, incParams);
  const income = incRes?.total || 0;

  // Expenses Total
  let expSql = "SELECT SUM(amount) as total FROM transactions WHERE type = 'expense'";
  const expParams: any[] = [];
  if (accFilter) {
    expSql += ' AND account_id = ?';
    expParams.push(accFilter);
  }
  if (filter.startDate) {
    expSql += ' AND transaction_date >= ?';
    expParams.push(filter.startDate);
  }
  if (filter.endDate) {
    const endStr = filter.endDate.length === 10 ? `${filter.endDate}T23:59:59` : filter.endDate;
    expSql += ' AND transaction_date <= ?';
    expParams.push(endStr);
  }
  const expRes = await db.querySingle<{ total: number }>(expSql, expParams);
  const expenses = expRes?.total || 0;

  const net = income - expenses;

  // Savings rate
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 10000) / 100 : null;

  // Calculate total days in date range (inclusive)
  const startDay = dayjs(filter.startDate.slice(0, 10));
  const endDay = dayjs(filter.endDate.slice(0, 10));
  const diffDays = Math.max(1, endDay.diff(startDay, 'day') + 1);

  const avgDailyExpense = Math.round(expenses / diffDays);

  // Highest spending day
  let hsdSql = `
    SELECT transaction_date as date, SUM(amount) as total
    FROM transactions
    WHERE type = 'expense'
  `;
  const hsdParams: any[] = [];
  if (accFilter) {
    hsdSql += ' AND account_id = ?';
    hsdParams.push(accFilter);
  }
  if (filter.startDate) {
    hsdSql += ' AND transaction_date >= ?';
    hsdParams.push(filter.startDate);
  }
  if (filter.endDate) {
    const endStr = filter.endDate.length === 10 ? `${filter.endDate}T23:59:59` : filter.endDate;
    hsdSql += ' AND transaction_date <= ?';
    hsdParams.push(endStr);
  }
  hsdSql += ' GROUP BY date ORDER BY total DESC LIMIT 1;';

  const hsdRows = await db.query<{ date?: string; transaction_date?: string; total: number }>(hsdSql, hsdParams);
  const hsdDate = hsdRows.length > 0 ? (hsdRows[0].date || hsdRows[0].transaction_date) : undefined;
  const highestSpendingDay =
    hsdRows.length > 0 && hsdRows[0].total > 0 && hsdDate
      ? { date: hsdDate.slice(0, 10), amount: hsdRows[0].total }
      : null;

  return {
    income,
    expenses,
    net,
    savingsRate,
    avgDailyExpense,
    totalDays: diffDays,
    highestSpendingDay,
  };
}

export async function getTrendPoints(
  db: DatabaseEngine,
  filter: { accountId?: string; startDate: string; endDate: string },
  period: ReportPeriod
): Promise<IncomeVsExpenseTrendPoint[]> {
  const accFilter = filter.accountId && filter.accountId !== 'ALL' ? filter.accountId : undefined;

  // Fetch all transactions in the date range to bin into time slots
  let sql = `
    SELECT type, amount, transaction_date
    FROM transactions
    WHERE transaction_date >= ? AND transaction_date <= ?
  `;
  const params: any[] = [filter.startDate, filter.endDate.length === 10 ? `${filter.endDate}T23:59:59` : filter.endDate];

  if (accFilter) {
    sql += ' AND account_id = ?';
    params.push(accFilter);
  }

  const txs = await db.query<{ type: 'income' | 'expense'; amount: number; transaction_date: string }>(sql, params);

  if (period === 'today') {
    let inc = 0;
    let exp = 0;
    txs.forEach((t) => {
      if (t.type === 'income') inc += t.amount;
      else if (t.type === 'expense') exp += t.amount;
    });
    return [
      {
        label: 'Today',
        date: filter.startDate.slice(0, 10),
        income: inc,
        expense: exp,
      },
    ];
  }

  if (period === 'week') {
    // 7 days Mon -> Sun
    const startMon = dayjs(filter.startDate.slice(0, 10)).startOf('isoWeek');
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const points: IncomeVsExpenseTrendPoint[] = [];

    for (let i = 0; i < 7; i++) {
      const currentDay = startMon.add(i, 'day');
      const dateStr = currentDay.format('YYYY-MM-DD');

      let inc = 0;
      let exp = 0;
      txs.forEach((t) => {
        if (t.transaction_date && t.transaction_date.slice(0, 10) === dateStr) {
          if (t.type === 'income') inc += t.amount;
          else if (t.type === 'expense') exp += t.amount;
        }
      });

      points.push({
        label: dayLabels[i],
        date: dateStr,
        income: inc,
        expense: exp,
      });
    }

    return points;
  }

  if (period === 'year') {
    // 12 months Jan -> Dec
    const startYear = dayjs(filter.startDate.slice(0, 10)).startOf('year');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const points: IncomeVsExpenseTrendPoint[] = [];

    for (let i = 0; i < 12; i++) {
      const currentMonth = startYear.add(i, 'month');
      const monthPrefix = currentMonth.format('YYYY-MM');

      let inc = 0;
      let exp = 0;
      txs.forEach((t) => {
        if (t.transaction_date && t.transaction_date.slice(0, 7) === monthPrefix) {
          if (t.type === 'income') inc += t.amount;
          else if (t.type === 'expense') exp += t.amount;
        }
      });

      points.push({
        label: monthNames[i],
        date: monthPrefix,
        income: inc,
        expense: exp,
      });
    }

    return points;
  }

  // Month or Custom Range
  const startDay = dayjs(filter.startDate.slice(0, 10));
  const endDay = dayjs(filter.endDate.slice(0, 10));
  const totalDays = Math.max(1, endDay.diff(startDay, 'day') + 1);

  if (totalDays <= 31) {
    // Daily points
    const points: IncomeVsExpenseTrendPoint[] = [];
    for (let i = 0; i < totalDays; i++) {
      const cur = startDay.add(i, 'day');
      const dateStr = cur.format('YYYY-MM-DD');

      let inc = 0;
      let exp = 0;
      txs.forEach((t) => {
        if (t.transaction_date && t.transaction_date.slice(0, 10) === dateStr) {
          if (t.type === 'income') inc += t.amount;
          else if (t.type === 'expense') exp += t.amount;
        }
      });

      points.push({
        label: cur.format('D MMM'),
        date: dateStr,
        income: inc,
        expense: exp,
      });
    }
    return points;
  } else {
    // Group by months
    const points: IncomeVsExpenseTrendPoint[] = [];
    let cur = startDay.startOf('month');
    const endMonth = endDay.endOf('month');

    while (cur.isBefore(endMonth) || cur.isSame(endMonth, 'month')) {
      const monthPrefix = cur.format('YYYY-MM');

      let inc = 0;
      let exp = 0;
      txs.forEach((t) => {
        if (t.transaction_date && t.transaction_date.slice(0, 7) === monthPrefix) {
          if (t.type === 'income') inc += t.amount;
          else if (t.type === 'expense') exp += t.amount;
        }
      });

      points.push({
        label: cur.format('MMM YY'),
        date: monthPrefix,
        income: inc,
        expense: exp,
      });

      cur = cur.add(1, 'month');
    }
    return points;
  }
}

export async function getCategoryReport(
  db: DatabaseEngine,
  filter: { accountId?: string; startDate: string; endDate: string },
  type: 'expense' | 'income'
): Promise<CategoryReportItem[]> {
  const accFilter = filter.accountId && filter.accountId !== 'ALL' ? filter.accountId : undefined;

  let sql = `
    SELECT c.id as categoryId, c.name as categoryName, c.icon as categoryIcon, c.color as categoryColor, SUM(t.amount) as amount
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.type = ?
  `;
  const params: any[] = [type];

  if (accFilter) {
    sql += ' AND t.account_id = ?';
    params.push(accFilter);
  }
  if (filter.startDate) {
    sql += ' AND t.transaction_date >= ?';
    params.push(filter.startDate);
  }
  if (filter.endDate) {
    const endStr = filter.endDate.length === 10 ? `${filter.endDate}T23:59:59` : filter.endDate;
    sql += ' AND t.transaction_date <= ?';
    params.push(endStr);
  }

  sql += ' GROUP BY c.id, c.name, c.icon, c.color ORDER BY amount DESC;';

  const rows = await db.query<{
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    amount: number;
  }>(sql, params);

  const totalAmount = rows.reduce((sum, r) => sum + (r.amount || 0), 0);

  return rows.map((r) => {
    const amt = r.amount || 0;
    const percentage = totalAmount > 0 ? Math.round((amt / totalAmount) * 10000) / 100 : 0;
    return {
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      categoryIcon: r.categoryIcon || 'Tag',
      categoryColor: r.categoryColor || '#3B82F6',
      amount: amt,
      percentage,
    };
  });
}

export async function getTopExpenseItems(
  db: DatabaseEngine,
  filter: { accountId?: string; startDate: string; endDate: string },
  limit = 5
): Promise<TopExpenseItem[]> {
  const accFilter = filter.accountId && filter.accountId !== 'ALL' ? filter.accountId : undefined;

  let sql = `
    SELECT t.id, t.note, t.category_id as categoryId, c.name as categoryName, c.icon as categoryIcon, c.color as categoryColor,
           t.account_id as accountId, a.name as accountName, t.amount, t.transaction_date as date
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    JOIN accounts a ON t.account_id = a.id
    WHERE t.type = 'expense'
  `;
  const params: any[] = [];

  if (accFilter) {
    sql += ' AND t.account_id = ?';
    params.push(accFilter);
  }
  if (filter.startDate) {
    sql += ' AND t.transaction_date >= ?';
    params.push(filter.startDate);
  }
  if (filter.endDate) {
    const endStr = filter.endDate.length === 10 ? `${filter.endDate}T23:59:59` : filter.endDate;
    sql += ' AND t.transaction_date <= ?';
    params.push(endStr);
  }

  sql += ' ORDER BY t.amount DESC LIMIT ?;';
  params.push(limit);

  const rows = await db.query<{
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
  }>(sql, params);

  return rows.map((r) => ({
    id: r.id,
    note: r.note,
    categoryId: r.categoryId,
    categoryName: r.categoryName || 'General',
    categoryIcon: r.categoryIcon || 'Tag',
    categoryColor: r.categoryColor || '#3B82F6',
    accountId: r.accountId,
    accountName: r.accountName || 'Account',
    amount: r.amount || 0,
    date: r.date,
  }));
}

export async function getAccountReport(
  db: DatabaseEngine,
  filter: { startDate: string; endDate: string }
): Promise<AccountReportItem[]> {
  const accounts = await db.query<{
    id: string;
    name: string;
    type: string;
    icon: string;
    color: string;
    is_active: number;
  }>('SELECT id, name, type, icon, color, is_active FROM accounts WHERE is_active = 1;');

  const endStr = filter.endDate.length === 10 ? `${filter.endDate}T23:59:59` : filter.endDate;

  const result: AccountReportItem[] = [];

  for (const acc of accounts) {
    const expRes = await db.querySingle<{ total: number }>(
      "SELECT SUM(amount) as total FROM transactions WHERE account_id = ? AND type = 'expense' AND transaction_date >= ? AND transaction_date <= ?;",
      [acc.id, filter.startDate, endStr]
    );

    const incRes = await db.querySingle<{ total: number }>(
      "SELECT SUM(amount) as total FROM transactions WHERE account_id = ? AND type = 'income' AND transaction_date >= ? AND transaction_date <= ?;",
      [acc.id, filter.startDate, endStr]
    );

    const expenses = expRes?.total || 0;
    const income = incRes?.total || 0;

    if (expenses > 0 || income > 0) {
      result.push({
        accountId: acc.id,
        accountName: acc.name,
        accountType: acc.type,
        accountIcon: acc.icon || 'Wallet',
        accountColor: acc.color || '#3B82F6',
        expenses,
        income,
      });
    }
  }

  result.sort((a, b) => b.expenses - a.expenses);
  return result;
}

export async function getMonthComparison(
  db: DatabaseEngine,
  accountId?: string
): Promise<MonthComparison> {
  const now = dayjs();
  const curStart = now.startOf('month').format('YYYY-MM-DD');
  const curEnd = now.endOf('month').format('YYYY-MM-DD');

  const prevStart = now.subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
  const prevEnd = now.subtract(1, 'month').endOf('month').format('YYYY-MM-DD');

  const curSummary = await getReportSummary(db, { accountId, startDate: curStart, endDate: curEnd });
  const prevSummary = await getReportSummary(db, { accountId, startDate: prevStart, endDate: prevEnd });

  let expenseDiffPct: number | null = null;
  if (prevSummary.expenses > 0) {
    expenseDiffPct = Math.round(((curSummary.expenses - prevSummary.expenses) / prevSummary.expenses) * 1000) / 10;
  }

  let incomeDiffPct: number | null = null;
  if (prevSummary.income > 0) {
    incomeDiffPct = Math.round(((curSummary.income - prevSummary.income) / prevSummary.income) * 1000) / 10;
  }

  return {
    currentMonthExpenses: curSummary.expenses,
    prevMonthExpenses: prevSummary.expenses,
    expenseDiffPct,
    currentMonthIncome: curSummary.income,
    prevMonthIncome: prevSummary.income,
    incomeDiffPct,
  };
}

export async function getYearComparison(
  db: DatabaseEngine,
  accountId?: string
): Promise<YearComparison> {
  const now = dayjs();
  const curStart = now.startOf('year').format('YYYY-MM-DD');
  const curEnd = now.endOf('year').format('YYYY-MM-DD');

  const prevStart = now.subtract(1, 'year').startOf('year').format('YYYY-MM-DD');
  const prevEnd = now.subtract(1, 'year').endOf('year').format('YYYY-MM-DD');

  const curSummary = await getReportSummary(db, { accountId, startDate: curStart, endDate: curEnd });
  const prevSummary = await getReportSummary(db, { accountId, startDate: prevStart, endDate: prevEnd });

  let expenseDiffPct: number | null = null;
  if (prevSummary.expenses > 0) {
    expenseDiffPct = Math.round(((curSummary.expenses - prevSummary.expenses) / prevSummary.expenses) * 1000) / 10;
  }

  let incomeDiffPct: number | null = null;
  if (prevSummary.income > 0) {
    incomeDiffPct = Math.round(((curSummary.income - prevSummary.income) / prevSummary.income) * 1000) / 10;
  }

  let netDiffPct: number | null = null;
  if (prevSummary.net !== 0) {
    netDiffPct = Math.round(((curSummary.net - prevSummary.net) / Math.abs(prevSummary.net)) * 1000) / 10;
  }

  return {
    currentYearExpenses: curSummary.expenses,
    prevYearExpenses: prevSummary.expenses,
    expenseDiffPct,
    currentYearIncome: curSummary.income,
    prevYearIncome: prevSummary.income,
    incomeDiffPct,
    currentYearNet: curSummary.net,
    prevYearNet: prevSummary.net,
    netDiffPct,
  };
}

export function generateRuleBasedInsights(
  summary: ReportSummary,
  topCategory?: CategoryReportItem,
  monthComp?: MonthComparison | null,
  currencySymbol = '₹'
): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  // 1. Month-over-month spending comparison
  if (monthComp && monthComp.prevMonthExpenses > 0 && monthComp.expenseDiffPct !== null) {
    const diff = Math.abs(monthComp.expenseDiffPct);
    if (monthComp.expenseDiffPct < 0) {
      insights.push({
        id: 'ins_mom_exp_down',
        type: 'positive',
        title: 'Reduced Expenses',
        description: `You spent ${diff}% less this month compared to last month. Great job managing your budget!`,
      });
    } else if (monthComp.expenseDiffPct > 0) {
      insights.push({
        id: 'ins_mom_exp_up',
        type: 'negative',
        title: 'Higher Expenses',
        description: `Your spending is up ${diff}% compared to last month. Keep an eye on non-essential purchases.`,
      });
    }
  }

  // 2. Savings Rate insight
  if (summary.savingsRate !== null) {
    if (summary.savingsRate >= 30) {
      insights.push({
        id: 'ins_savings_high',
        type: 'positive',
        title: 'Strong Savings Rate',
        description: `Your savings rate is ${summary.savingsRate}%, well above the recommended 20% benchmark.`,
      });
    } else if (summary.savingsRate > 0) {
      insights.push({
        id: 'ins_savings_moderate',
        type: 'info',
        title: 'Positive Net Flow',
        description: `You saved ${summary.savingsRate}% of your income during this period.`,
      });
    } else {
      insights.push({
        id: 'ins_savings_deficit',
        type: 'negative',
        title: 'Expense Deficit',
        description: 'Your expenses exceeded your income during this period. Review top spending categories.',
      });
    }
  }

  // 3. Top category insight
  if (topCategory && topCategory.percentage > 0) {
    insights.push({
      id: 'ins_top_cat',
      type: topCategory.percentage > 40 ? 'info' : 'neutral',
      title: 'Top Category Driver',
      description: `${topCategory.categoryName} is your largest expense, accounting for ${topCategory.percentage}% of total spending.`,
    });
  }

  // 4. Daily average spending
  if (summary.avgDailyExpense > 0) {
    const formattedAvg = `${currencySymbol}${(summary.avgDailyExpense / 100).toLocaleString('en-IN')}`;
    insights.push({
      id: 'ins_daily_avg',
      type: 'neutral',
      title: 'Average Daily Spend',
      description: `Your average daily expense across ${summary.totalDays} days is ${formattedAvg}.`,
    });
  }

  return insights;
}

export async function fetchFullReportData(
  db: DatabaseEngine,
  filter: { period: ReportPeriod; accountId?: string; startDate: string; endDate: string },
  currencySymbol = '₹'
): Promise<FullReportData> {
  const summary = await getReportSummary(db, filter);
  const trendPoints = await getTrendPoints(db, filter, filter.period);
  const expenseCategories = await getCategoryReport(db, filter, 'expense');
  const incomeCategories = await getCategoryReport(db, filter, 'income');
  const topExpenses = await getTopExpenseItems(db, filter, 5);
  const accountBreakdown = await getAccountReport(db, { startDate: filter.startDate, endDate: filter.endDate });

  let monthComparison: MonthComparison | null = null;
  if (filter.period === 'month') {
    monthComparison = await getMonthComparison(db, filter.accountId);
  }

  let yearComparison: YearComparison | null = null;
  if (filter.period === 'year') {
    yearComparison = await getYearComparison(db, filter.accountId);
  }

  const topCategory = expenseCategories.length > 0 ? expenseCategories[0] : undefined;
  const insights = generateRuleBasedInsights(summary, topCategory, monthComparison, currencySymbol);

  return {
    summary,
    trendPoints,
    expenseCategories,
    incomeCategories,
    topExpenses,
    accountBreakdown,
    monthComparison,
    yearComparison,
    insights,
  };
}
