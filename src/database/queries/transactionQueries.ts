/**
 * Transaction Database Queries (Income & Expense)
 */

import { DatabaseEngine } from '../databaseEngine';

export interface DbTransaction {
  id: string;
  account_id: string;
  category_id: string;
  type: 'income' | 'expense';
  amount: number; // in minor units (paise)
  note?: string;
  transaction_date: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export async function getTransactions(
  db: DatabaseEngine,
  filter?: {
    accountId?: string;
    categoryId?: string;
    type?: 'income' | 'expense';
    searchQuery?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
  }
): Promise<DbTransaction[]> {
  let sql = 'SELECT t.* FROM transactions t';
  const conditions: string[] = [];
  const params: any[] = [];

  // If search query is provided, join categories and accounts to search note, category name, account name
  if (filter?.searchQuery && filter.searchQuery.trim()) {
    sql += ` LEFT JOIN categories c ON t.category_id = c.id
             LEFT JOIN accounts a ON t.account_id = a.id`;
    const searchPattern = `%${filter.searchQuery.trim().toLowerCase()}%`;
    conditions.push('(LOWER(COALESCE(t.note, "")) LIKE ? OR LOWER(COALESCE(c.name, "")) LIKE ? OR LOWER(COALESCE(a.name, "")) LIKE ?)');
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (filter?.accountId && filter.accountId !== 'ALL') {
    conditions.push('t.account_id = ?');
    params.push(filter.accountId);
  }
  if (filter?.categoryId) {
    conditions.push('t.category_id = ?');
    params.push(filter.categoryId);
  }
  if (filter?.type) {
    conditions.push('t.type = ?');
    params.push(filter.type);
  }
  if (filter?.startDate) {
    conditions.push('t.transaction_date >= ?');
    params.push(filter.startDate);
  }
  if (filter?.endDate) {
    // Append 'T23:59:59' if length is 10 (YYYY-MM-DD) so it covers full end day
    const endStr = filter.endDate.length === 10 ? `${filter.endDate}T23:59:59` : filter.endDate;
    conditions.push('t.transaction_date <= ?');
    params.push(endStr);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  switch (filter?.sortBy) {
    case 'date_asc':
      sql += ' ORDER BY t.transaction_date ASC, t.created_at ASC;';
      break;
    case 'amount_desc':
      sql += ' ORDER BY t.amount DESC, t.transaction_date DESC;';
      break;
    case 'amount_asc':
      sql += ' ORDER BY t.amount ASC, t.transaction_date DESC;';
      break;
    case 'date_desc':
    default:
      sql += ' ORDER BY t.transaction_date DESC, t.created_at DESC;';
      break;
  }

  return db.query<DbTransaction>(sql, params);
}

export async function getIncomeTotal(
  db: DatabaseEngine,
  filter?: { accountId?: string; startDate?: string; endDate?: string }
): Promise<number> {
  let sql = "SELECT SUM(amount) as total FROM transactions WHERE type = 'income'";
  const params: any[] = [];

  if (filter?.accountId && filter.accountId !== 'ALL') {
    sql += ' AND account_id = ?';
    params.push(filter.accountId);
  }
  if (filter?.startDate) {
    sql += ' AND transaction_date >= ?';
    params.push(filter.startDate);
  }
  if (filter?.endDate) {
    const endStr = filter.endDate.length === 10 ? `${filter.endDate}T23:59:59` : filter.endDate;
    sql += ' AND transaction_date <= ?';
    params.push(endStr);
  }

  const res = await db.querySingle<{ total: number }>(sql, params);
  return res?.total || 0;
}

export async function getExpenseTotal(
  db: DatabaseEngine,
  filter?: { accountId?: string; startDate?: string; endDate?: string }
): Promise<number> {
  let sql = "SELECT SUM(amount) as total FROM transactions WHERE type = 'expense'";
  const params: any[] = [];

  if (filter?.accountId && filter.accountId !== 'ALL') {
    sql += ' AND account_id = ?';
    params.push(filter.accountId);
  }
  if (filter?.startDate) {
    sql += ' AND transaction_date >= ?';
    params.push(filter.startDate);
  }
  if (filter?.endDate) {
    const endStr = filter.endDate.length === 10 ? `${filter.endDate}T23:59:59` : filter.endDate;
    sql += ' AND transaction_date <= ?';
    params.push(endStr);
  }

  const res = await db.querySingle<{ total: number }>(sql, params);
  return res?.total || 0;
}

export async function getPeriodIncome(
  db: DatabaseEngine,
  filter?: { accountId?: string; startDate?: string; endDate?: string }
): Promise<number> {
  return getIncomeTotal(db, filter);
}

export async function getPeriodExpenses(
  db: DatabaseEngine,
  filter?: { accountId?: string; startDate?: string; endDate?: string }
): Promise<number> {
  return getExpenseTotal(db, filter);
}

export async function getPeriodNet(
  db: DatabaseEngine,
  filter?: { accountId?: string; startDate?: string; endDate?: string }
): Promise<number> {
  const inc = await getIncomeTotal(db, filter);
  const exp = await getExpenseTotal(db, filter);
  return inc - exp;
}

export interface CategorySpendingSummary {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  totalAmount: number;
}

export async function getTopExpenseCategories(
  db: DatabaseEngine,
  filter?: { accountId?: string; startDate?: string; endDate?: string; limit?: number }
): Promise<CategorySpendingSummary[]> {
  let sql = `
    SELECT c.id as categoryId, c.name as categoryName, c.icon as categoryIcon, c.color as categoryColor, SUM(t.amount) as totalAmount
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.type = 'expense'
  `;
  const params: any[] = [];

  if (filter?.accountId && filter.accountId !== 'ALL') {
    sql += ' AND t.account_id = ?';
    params.push(filter.accountId);
  }
  if (filter?.startDate) {
    sql += ' AND t.transaction_date >= ?';
    params.push(filter.startDate);
  }
  if (filter?.endDate) {
    const endStr = filter.endDate.length === 10 ? `${filter.endDate}T23:59:59` : filter.endDate;
    sql += ' AND t.transaction_date <= ?';
    params.push(endStr);
  }

  sql += ' GROUP BY c.id, c.name, c.icon, c.color ORDER BY totalAmount DESC';

  if (filter?.limit && filter.limit > 0) {
    sql += ' LIMIT ?';
    params.push(filter.limit);
  }

  const rows = await db.query<{ categoryId: string; categoryName: string; categoryIcon: string; categoryColor: string; totalAmount: number }>(sql, params);
  return rows.map((r) => ({ ...r, totalAmount: r.totalAmount || 0 }));
}

export interface AccountSpendingSummary {
  accountId: string;
  accountName: string;
  accountType: string;
  accountIcon: string;
  accountColor: string;
  totalAmount: number;
}

export async function getAccountExpenses(
  db: DatabaseEngine,
  filter?: { startDate?: string; endDate?: string }
): Promise<AccountSpendingSummary[]> {
  let sql = `
    SELECT a.id as accountId, a.name as accountName, a.type as accountType, a.icon as accountIcon, a.color as accountColor, SUM(t.amount) as totalAmount
    FROM transactions t
    JOIN accounts a ON t.account_id = a.id
    WHERE t.type = 'expense' AND a.is_active = 1
  `;
  const params: any[] = [];

  if (filter?.startDate) {
    sql += ' AND t.transaction_date >= ?';
    params.push(filter.startDate);
  }
  if (filter?.endDate) {
    const endStr = filter.endDate.length === 10 ? `${filter.endDate}T23:59:59` : filter.endDate;
    sql += ' AND t.transaction_date <= ?';
    params.push(endStr);
  }

  sql += ' GROUP BY a.id, a.name, a.type, a.icon, a.color ORDER BY totalAmount DESC;';

  const rows = await db.query<AccountSpendingSummary>(sql, params);
  return rows.map((r) => ({ ...r, totalAmount: r.totalAmount || 0 }));
}

export async function getAccountIncome(
  db: DatabaseEngine,
  filter?: { startDate?: string; endDate?: string }
): Promise<AccountSpendingSummary[]> {
  let sql = `
    SELECT a.id as accountId, a.name as accountName, a.type as accountType, a.icon as accountIcon, a.color as accountColor, SUM(t.amount) as totalAmount
    FROM transactions t
    JOIN accounts a ON t.account_id = a.id
    WHERE t.type = 'income' AND a.is_active = 1
  `;
  const params: any[] = [];

  if (filter?.startDate) {
    sql += ' AND t.transaction_date >= ?';
    params.push(filter.startDate);
  }
  if (filter?.endDate) {
    const endStr = filter.endDate.length === 10 ? `${filter.endDate}T23:59:59` : filter.endDate;
    sql += ' AND t.transaction_date <= ?';
    params.push(endStr);
  }

  sql += ' GROUP BY a.id, a.name, a.type, a.icon, a.color ORDER BY totalAmount DESC;';

  const rows = await db.query<AccountSpendingSummary>(sql, params);
  return rows.map((r) => ({ ...r, totalAmount: r.totalAmount || 0 }));
}

export interface DbActivityItem {
  kind: 'transaction' | 'transfer';
  id: string;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  note?: string;
  date: string;
  createdAt: string;
}

export async function getRecentActivity(
  db: DatabaseEngine,
  filter?: { accountId?: string; limit?: number }
): Promise<DbActivityItem[]> {
  const limitVal = filter?.limit || 10;
  let sql = `
    SELECT * FROM (
      SELECT 'transaction' as kind, t.id, t.account_id as accountId, '' as toAccountId, t.category_id as categoryId, t.type, t.amount, t.note, t.transaction_date as date, t.created_at as createdAt
      FROM transactions t
      WHERE (? IS NULL OR ? = 'ALL' OR t.account_id = ?)

      UNION ALL

      SELECT 'transfer' as kind, tr.id, tr.from_account_id as accountId, tr.to_account_id as toAccountId, '' as categoryId, 'transfer' as type, tr.amount, tr.note, tr.transfer_date as date, tr.created_at as createdAt
      FROM transfers tr
      WHERE (? IS NULL OR ? = 'ALL' OR tr.from_account_id = ? OR tr.to_account_id = ?)
    )
    ORDER BY date DESC, createdAt DESC
    LIMIT ?;
  `;

  const acc = filter?.accountId || 'ALL';
  const params = [acc, acc, acc, acc, acc, acc, acc, limitVal];
  return db.query<DbActivityItem>(sql, params);
}

export async function getTransactionById(db: DatabaseEngine, id: string): Promise<DbTransaction | null> {
  return db.querySingle<DbTransaction>('SELECT * FROM transactions WHERE id = ?;', [id]);
}

export async function createTransaction(
  db: DatabaseEngine,
  tx: {
    account_id: string;
    category_id: string;
    type: 'income' | 'expense';
    amount: number; // in minor units
    note?: string;
    transaction_date: string;
  }
): Promise<DbTransaction> {
  if (tx.amount <= 0) {
    throw new Error('Transaction amount must be greater than zero');
  }

  const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO transactions (id, account_id, category_id, type, amount, note, transaction_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [id, tx.account_id, tx.category_id, tx.type, tx.amount, tx.note || null, tx.transaction_date, now, now]
  );

  return {
    id,
    account_id: tx.account_id,
    category_id: tx.category_id,
    type: tx.type,
    amount: tx.amount,
    note: tx.note,
    transaction_date: tx.transaction_date,
    created_at: now,
    updated_at: now,
  };
}

export async function updateTransaction(
  db: DatabaseEngine,
  id: string,
  data: Partial<Omit<DbTransaction, 'id' | 'created_at'>>
): Promise<DbTransaction | null> {
  const existing = await getTransactionById(db, id);
  if (!existing) return null;

  if (data.amount !== undefined && data.amount <= 0) {
    throw new Error('Transaction amount must be greater than zero');
  }

  const now = new Date().toISOString();
  const account_id = data.account_id !== undefined ? data.account_id : existing.account_id;
  const category_id = data.category_id !== undefined ? data.category_id : existing.category_id;
  const type = data.type !== undefined ? data.type : existing.type;
  const amount = data.amount !== undefined ? data.amount : existing.amount;
  const note = data.note !== undefined ? data.note : existing.note;
  const transaction_date = data.transaction_date !== undefined ? data.transaction_date : existing.transaction_date;

  await db.execute(
    `UPDATE transactions
     SET account_id = ?, category_id = ?, type = ?, amount = ?, note = ?, transaction_date = ?, updated_at = ?
     WHERE id = ?;`,
    [account_id, category_id, type, amount, note || null, transaction_date, now, id]
  );

  return getTransactionById(db, id);
}

export async function deleteTransaction(db: DatabaseEngine, id: string): Promise<boolean> {
  const res = await db.execute('DELETE FROM transactions WHERE id = ?;', [id]);
  return res.rowsAffected > 0;
}
