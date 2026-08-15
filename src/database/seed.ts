/**
 * Database Category Seeding
 * Seeds default expense and income categories into SQLite table
 */

import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../constants';
import { DatabaseEngine } from './databaseEngine';

export async function seedDefaultCategories(db: DatabaseEngine): Promise<void> {
  const existingCount = await db.querySingle<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories;'
  );

  if (existingCount && existingCount.count > 0) {
    return; // Already seeded
  }

  const now = new Date().toISOString();

  // Execute in an atomic transaction
  await db.transaction(async () => {
    let index = 1;

    for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
      const id = `cat_exp_${index++}`;
      await db.execute(
        `INSERT INTO categories (id, name, type, icon, color, is_default, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?);`,
        [id, cat.name, 'expense', cat.icon, cat.color, now, now]
      );
    }

    index = 1;
    for (const cat of DEFAULT_INCOME_CATEGORIES) {
      const id = `cat_inc_${index++}`;
      await db.execute(
        `INSERT INTO categories (id, name, type, icon, color, is_default, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?);`,
        [id, cat.name, 'income', cat.icon, cat.color, now, now]
      );
    }
  });
}
