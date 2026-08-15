/**
 * Database Migration Manager
 * Handles database versioning, upgrades, and schema migrations safely without data loss.
 */

import { CREATE_INDEXES_SQL, CREATE_TABLES_SQL, DATABASE_VERSION } from '../schema';
import { DatabaseEngine } from '../databaseEngine';

export async function runMigrations(db: DatabaseEngine): Promise<void> {
  // Ensure metadata/settings table exists
  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const currentVersionRow = await db.querySingle<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'database_version';"
  );

  const currentVersion = currentVersionRow ? parseInt(currentVersionRow.value, 10) : 0;

  if (currentVersion < 1) {
    // Migration Version 1: Create initial tables and indexes
    await db.transaction(async () => {
      for (const tableSql of CREATE_TABLES_SQL) {
        await db.execute(tableSql);
      }
      for (const indexSql of CREATE_INDEXES_SQL) {
        await db.execute(indexSql);
      }

      // Default Notification Settings Row
      const now = new Date().toISOString();
      await db.execute(`
        INSERT OR IGNORE INTO notification_settings (id, enabled, reminder_time, created_at, updated_at)
        VALUES ('default_notification', 0, '19:00', '${now}', '${now}');
      `);

      await db.execute(`
        INSERT OR REPLACE INTO settings (key, value)
        VALUES ('database_version', '1');
      `);
    });
  }

  // Future migrations can be appended sequentially:
  // if (currentVersion < 2) { ... }
}
