/**
 * Balance Adjustment Database Queries
 * Records balance discrepancy corrections instead of silently overwriting account balances.
 */

import { DatabaseEngine } from '../databaseEngine';

export interface DbBalanceAdjustment {
  id: string;
  account_id: string;
  amount: number; // positive or negative minor units (paise)
  reason?: string;
  adjustment_date: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export async function getBalanceAdjustments(db: DatabaseEngine, accountId?: string): Promise<DbBalanceAdjustment[]> {
  if (accountId) {
    return db.query<DbBalanceAdjustment>(
      'SELECT * FROM balance_adjustments WHERE account_id = ? ORDER BY adjustment_date DESC, created_at DESC;',
      [accountId]
    );
  }
  return db.query<DbBalanceAdjustment>('SELECT * FROM balance_adjustments ORDER BY adjustment_date DESC, created_at DESC;');
}

export async function createBalanceAdjustment(
  db: DatabaseEngine,
  adj: {
    account_id: string;
    amount: number;
    reason?: string;
    adjustment_date: string;
  }
): Promise<DbBalanceAdjustment> {
  const id = `adj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO balance_adjustments (id, account_id, amount, reason, adjustment_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [id, adj.account_id, adj.amount, adj.reason || null, adj.adjustment_date, now, now]
  );

  return {
    id,
    account_id: adj.account_id,
    amount: adj.amount,
    reason: adj.reason,
    adjustment_date: adj.adjustment_date,
    created_at: now,
    updated_at: now,
  };
}

export async function deleteBalanceAdjustment(db: DatabaseEngine, id: string): Promise<boolean> {
  const res = await db.execute('DELETE FROM balance_adjustments WHERE id = ?;', [id]);
  return res.rowsAffected > 0;
}
