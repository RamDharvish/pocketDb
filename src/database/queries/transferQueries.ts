/**
 * Transfer Database Queries
 * Handles inter-account transfers. Validates that source != destination and runs atomically.
 */

import { DatabaseEngine } from '../databaseEngine';

export interface DbTransfer {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number; // minor units (paise)
  note?: string;
  transfer_date: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export async function getTransfers(db: DatabaseEngine, accountId?: string): Promise<DbTransfer[]> {
  if (accountId) {
    return db.query<DbTransfer>(
      'SELECT * FROM transfers WHERE from_account_id = ? OR to_account_id = ? ORDER BY transfer_date DESC, created_at DESC;',
      [accountId, accountId]
    );
  }
  return db.query<DbTransfer>('SELECT * FROM transfers ORDER BY transfer_date DESC, created_at DESC;');
}

export async function getTransferById(db: DatabaseEngine, id: string): Promise<DbTransfer | null> {
  return db.querySingle<DbTransfer>('SELECT * FROM transfers WHERE id = ?;', [id]);
}

export async function createTransfer(
  db: DatabaseEngine,
  trf: {
    from_account_id: string;
    to_account_id: string;
    amount: number;
    note?: string;
    transfer_date: string;
  }
): Promise<DbTransfer> {
  if (trf.amount <= 0) {
    throw new Error('Transfer amount must be greater than zero');
  }

  if (trf.from_account_id === trf.to_account_id) {
    throw new Error('Source account and destination account cannot be the same account');
  }

  const id = `trf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  let createdTransfer: DbTransfer | null = null;

  await db.transaction(async () => {
    await db.execute(
      `INSERT INTO transfers (id, from_account_id, to_account_id, amount, note, transfer_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [id, trf.from_account_id, trf.to_account_id, trf.amount, trf.note || null, trf.transfer_date, now, now]
    );

    createdTransfer = {
      id,
      from_account_id: trf.from_account_id,
      to_account_id: trf.to_account_id,
      amount: trf.amount,
      note: trf.note,
      transfer_date: trf.transfer_date,
      created_at: now,
      updated_at: now,
    };
  });

  if (!createdTransfer) throw new Error('Transfer creation failed');
  return createdTransfer;
}

export async function updateTransfer(
  db: DatabaseEngine,
  id: string,
  data: Partial<Omit<DbTransfer, 'id' | 'created_at'>>
): Promise<DbTransfer | null> {
  const existing = await getTransferById(db, id);
  if (!existing) return null;

  if (data.amount !== undefined && data.amount <= 0) {
    throw new Error('Transfer amount must be greater than zero');
  }

  const fromId = data.from_account_id !== undefined ? data.from_account_id : existing.from_account_id;
  const toId = data.to_account_id !== undefined ? data.to_account_id : existing.to_account_id;

  if (fromId === toId) {
    throw new Error('Source account and destination account cannot be the same account');
  }

  const now = new Date().toISOString();
  const amount = data.amount !== undefined ? data.amount : existing.amount;
  const note = data.note !== undefined ? data.note : existing.note;
  const transfer_date = data.transfer_date !== undefined ? data.transfer_date : existing.transfer_date;

  await db.transaction(async () => {
    await db.execute(
      `UPDATE transfers
       SET from_account_id = ?, to_account_id = ?, amount = ?, note = ?, transfer_date = ?, updated_at = ?
       WHERE id = ?;`,
      [fromId, toId, amount, note || null, transfer_date, now, id]
    );
  });

  return getTransferById(db, id);
}

export async function deleteTransfer(db: DatabaseEngine, id: string): Promise<boolean> {
  let success = false;
  await db.transaction(async () => {
    const res = await db.execute('DELETE FROM transfers WHERE id = ?;', [id]);
    success = res.rowsAffected > 0;
  });
  return success;
}

export async function getTransfersByAccount(db: DatabaseEngine, accountId: string): Promise<DbTransfer[]> {
  return getTransfers(db, accountId);
}

export async function getTransfersByDateRange(
  db: DatabaseEngine,
  startDate: string,
  endDate: string,
  accountId?: string
): Promise<DbTransfer[]> {
  if (accountId) {
    return db.query<DbTransfer>(
      `SELECT * FROM transfers
       WHERE (from_account_id = ? OR to_account_id = ?)
         AND transfer_date >= ? AND transfer_date <= ?
       ORDER BY transfer_date DESC, created_at DESC;`,
      [accountId, accountId, startDate, endDate]
    );
  }
  return db.query<DbTransfer>(
    `SELECT * FROM transfers
     WHERE transfer_date >= ? AND transfer_date <= ?
     ORDER BY transfer_date DESC, created_at DESC;`,
    [startDate, endDate]
  );
}

export async function searchTransfers(
  db: DatabaseEngine,
  searchQuery: string,
  accountId?: string
): Promise<DbTransfer[]> {
  const term = `%${searchQuery.trim().toLowerCase()}%`;
  if (accountId) {
    return db.query<DbTransfer>(
      `SELECT * FROM transfers
       WHERE (from_account_id = ? OR to_account_id = ?)
         AND (LOWER(note) LIKE ?)
       ORDER BY transfer_date DESC, created_at DESC;`,
      [accountId, accountId, term]
    );
  }
  return db.query<DbTransfer>(
    `SELECT * FROM transfers
     WHERE LOWER(note) LIKE ?
     ORDER BY transfer_date DESC, created_at DESC;`,
    [term]
  );
}
