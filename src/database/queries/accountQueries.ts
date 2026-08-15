/**
 * Account Database Queries
 * Supports account CRUD, archiving, derived account balance calculation, and total balance aggregation.
 */

import { DatabaseEngine } from '../databaseEngine';

export interface DbAccount {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'wallet' | 'credit_card' | 'other';
  opening_balance: number; // in minor units (paise)
  icon: string;
  color: string;
  is_active: number; // 1 or 0
  created_at: string;
  updated_at: string;
}

export async function getAccounts(db: DatabaseEngine, includeArchived = false): Promise<DbAccount[]> {
  if (includeArchived) {
    return db.query<DbAccount>('SELECT * FROM accounts ORDER BY created_at ASC;');
  }
  return db.query<DbAccount>('SELECT * FROM accounts WHERE is_active = 1 ORDER BY created_at ASC;');
}

export async function getAccountById(db: DatabaseEngine, id: string): Promise<DbAccount | null> {
  return db.querySingle<DbAccount>('SELECT * FROM accounts WHERE id = ?;', [id]);
}

export async function createAccount(
  db: DatabaseEngine,
  account: {
    name: string;
    type: DbAccount['type'];
    opening_balance?: number;
    icon?: string;
    color?: string;
  }
): Promise<DbAccount> {
  const id = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const openingBal = account.opening_balance || 0;
  const icon = account.icon || (account.type === 'bank' ? 'Landmark' : account.type === 'cash' ? 'Banknote' : 'Wallet');
  const color = account.color || '#3B82F6';

  await db.execute(
    `INSERT INTO accounts (id, name, type, opening_balance, icon, color, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?);`,
    [id, account.name, account.type, openingBal, icon, color, now, now]
  );

  return {
    id,
    name: account.name,
    type: account.type,
    opening_balance: openingBal,
    icon,
    color,
    is_active: 1,
    created_at: now,
    updated_at: now,
  };
}

export async function updateAccount(
  db: DatabaseEngine,
  id: string,
  data: Partial<Pick<DbAccount, 'name' | 'type' | 'icon' | 'color' | 'opening_balance'>>
): Promise<DbAccount | null> {
  const existing = await getAccountById(db, id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updatedName = data.name !== undefined ? data.name : existing.name;
  const updatedType = data.type !== undefined ? data.type : existing.type;
  const updatedIcon = data.icon !== undefined ? data.icon : existing.icon;
  const updatedColor = data.color !== undefined ? data.color : existing.color;
  const updatedOpening = data.opening_balance !== undefined ? data.opening_balance : existing.opening_balance;

  await db.execute(
    `UPDATE accounts
     SET name = ?, type = ?, icon = ?, color = ?, opening_balance = ?, updated_at = ?
     WHERE id = ?;`,
    [updatedName, updatedType, updatedIcon, updatedColor, updatedOpening, now, id]
  );

  return getAccountById(db, id);
}

export async function archiveAccount(db: DatabaseEngine, id: string): Promise<boolean> {
  const now = new Date().toISOString();
  const res = await db.execute('UPDATE accounts SET is_active = 0, updated_at = ? WHERE id = ?;', [now, id]);
  return res.rowsAffected > 0;
}

/**
 * Checks if an account contains financial history (transactions, transfers, or balance adjustments)
 */
export async function hasFinancialHistory(db: DatabaseEngine, accountId: string): Promise<boolean> {
  const txRes = await db.querySingle<{ count: number }>(
    'SELECT COUNT(*) as count FROM transactions WHERE account_id = ?;',
    [accountId]
  );
  if (txRes && txRes.count > 0) return true;

  const trfRes = await db.querySingle<{ count: number }>(
    'SELECT COUNT(*) as count FROM transfers WHERE from_account_id = ? OR to_account_id = ?;',
    [accountId, accountId]
  );
  if (trfRes && trfRes.count > 0) return true;

  const adjRes = await db.querySingle<{ count: number }>(
    'SELECT COUNT(*) as count FROM balance_adjustments WHERE account_id = ?;',
    [accountId]
  );
  if (adjRes && adjRes.count > 0) return true;

  return false;
}

/**
 * Safely deletes an account if it has no financial history.
 * If financial history exists, returns success: false with explanatory message.
 */
export async function deleteAccountSafely(
  db: DatabaseEngine,
  accountId: string
): Promise<{ success: boolean; message?: string }> {
  const hasHistory = await hasFinancialHistory(db, accountId);
  if (hasHistory) {
    return {
      success: false,
      message: 'This account contains financial history and cannot be permanently deleted. You can archive it instead.',
    };
  }

  const res = await db.execute('DELETE FROM accounts WHERE id = ?;', [accountId]);
  return { success: res.rowsAffected > 0 };
}

/**
 * Calculates current balance derived dynamically from:
 * opening_balance
 * + income transactions
 * - expense transactions
 * + incoming transfers
 * - outgoing transfers
 * + balance adjustments
 */
export async function getAccountBalance(db: DatabaseEngine, accountId: string): Promise<number> {
  const account = await getAccountById(db, accountId);
  if (!account) return 0;

  // 1. Income sum
  const incRes = await db.querySingle<{ total: number }>(
    "SELECT SUM(amount) as total FROM transactions WHERE account_id = ? AND type = 'income';",
    [accountId]
  );
  const incomeSum = incRes ? incRes.total || 0 : 0;

  // 2. Expense sum
  const expRes = await db.querySingle<{ total: number }>(
    "SELECT SUM(amount) as total FROM transactions WHERE account_id = ? AND type = 'expense';",
    [accountId]
  );
  const expenseSum = expRes ? expRes.total || 0 : 0;

  // 3. Incoming transfers sum
  const inTrfRes = await db.querySingle<{ total: number }>(
    'SELECT SUM(amount) as total FROM transfers WHERE to_account_id = ?;',
    [accountId]
  );
  const incomingTrfSum = inTrfRes ? inTrfRes.total || 0 : 0;

  // 4. Outgoing transfers sum
  const outTrfRes = await db.querySingle<{ total: number }>(
    'SELECT SUM(amount) as total FROM transfers WHERE from_account_id = ?;',
    [accountId]
  );
  const outgoingTrfSum = outTrfRes ? outTrfRes.total || 0 : 0;

  // 5. Balance adjustments sum
  const adjRes = await db.querySingle<{ total: number }>(
    'SELECT SUM(amount) as total FROM balance_adjustments WHERE account_id = ?;',
    [accountId]
  );
  const adjSum = adjRes ? adjRes.total || 0 : 0;

  return account.opening_balance + incomeSum - expenseSum + incomingTrfSum - outgoingTrfSum + adjSum;
}

/**
 * Calculates total balance across all active accounts without double counting transfers.
 */
export async function getTotalBalance(db: DatabaseEngine): Promise<number> {
  const activeAccounts = await getAccounts(db, false);
  let total = 0;

  for (const acc of activeAccounts) {
    const bal = await getAccountBalance(db, acc.id);
    total += bal;
  }

  return total;
}
