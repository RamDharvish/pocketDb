/**
 * Category Database Queries
 */

import { DatabaseEngine } from '../databaseEngine';

export interface DbCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  is_default: number; // 1 or 0
  is_active: number; // 1 or 0
  created_at: string;
  updated_at: string;
}

export async function getCategories(db: DatabaseEngine, includeArchived = false): Promise<DbCategory[]> {
  if (includeArchived) {
    return db.query<DbCategory>('SELECT * FROM categories ORDER BY name ASC;');
  }
  return db.query<DbCategory>('SELECT * FROM categories WHERE is_active = 1 ORDER BY name ASC;');
}

export async function getIncomeCategories(db: DatabaseEngine): Promise<DbCategory[]> {
  return db.query<DbCategory>("SELECT * FROM categories WHERE type = 'income' AND is_active = 1 ORDER BY name ASC;");
}

export async function getExpenseCategories(db: DatabaseEngine): Promise<DbCategory[]> {
  return db.query<DbCategory>("SELECT * FROM categories WHERE type = 'expense' AND is_active = 1 ORDER BY name ASC;");
}

export async function getCategoryById(db: DatabaseEngine, id: string): Promise<DbCategory | null> {
  return db.querySingle<DbCategory>('SELECT * FROM categories WHERE id = ?;', [id]);
}

export async function createCategory(
  db: DatabaseEngine,
  cat: {
    name: string;
    type: 'income' | 'expense';
    icon: string;
    color: string;
  }
): Promise<DbCategory> {
  const id = `cat_custom_${Date.now()}`;
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO categories (id, name, type, icon, color, is_default, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, 1, ?, ?);`,
    [id, cat.name, cat.type, cat.icon, cat.color, now, now]
  );

  return {
    id,
    name: cat.name,
    type: cat.type,
    icon: cat.icon,
    color: cat.color,
    is_default: 0,
    is_active: 1,
    created_at: now,
    updated_at: now,
  };
}

export async function updateCategory(
  db: DatabaseEngine,
  id: string,
  data: Partial<Pick<DbCategory, 'name' | 'icon' | 'color'>>
): Promise<DbCategory | null> {
  const existing = await getCategoryById(db, id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const name = data.name !== undefined ? data.name : existing.name;
  const icon = data.icon !== undefined ? data.icon : existing.icon;
  const color = data.color !== undefined ? data.color : existing.color;

  await db.execute(
    `UPDATE categories SET name = ?, icon = ?, color = ?, updated_at = ? WHERE id = ?;`,
    [name, icon, color, now, id]
  );

  return getCategoryById(db, id);
}

export async function archiveCategory(db: DatabaseEngine, id: string): Promise<boolean> {
  const now = new Date().toISOString();
  const res = await db.execute('UPDATE categories SET is_active = 0, updated_at = ? WHERE id = ?;', [now, id]);
  return res.rowsAffected > 0;
}
