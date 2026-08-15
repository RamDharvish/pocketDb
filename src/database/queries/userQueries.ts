/**
 * User Database Queries
 */

import { DatabaseEngine } from '../databaseEngine';

export interface DbUser {
  id: string;
  name: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export async function getUser(db: DatabaseEngine): Promise<DbUser | null> {
  return db.querySingle<DbUser>('SELECT * FROM users LIMIT 1;');
}

export async function createUser(db: DatabaseEngine, name: string, currency: string = 'INR'): Promise<DbUser> {
  const id = `usr_${Date.now()}`;
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO users (id, name, currency, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?);`,
    [id, name, currency, now, now]
  );

  return { id, name, currency, created_at: now, updated_at: now };
}

export async function updateUser(db: DatabaseEngine, name: string, currency: string): Promise<DbUser> {
  const existing = await getUser(db);
  if (!existing) {
    return createUser(db, name, currency);
  }

  const now = new Date().toISOString();
  await db.execute(
    `UPDATE users SET name = ?, currency = ?, updated_at = ? WHERE id = ?;`,
    [name, currency, now, existing.id]
  );

  return { ...existing, name, currency, updated_at: now };
}
