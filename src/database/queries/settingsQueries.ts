/**
 * Settings & Notification Settings Database Queries
 */

import { DatabaseEngine } from '../databaseEngine';

export interface DbNotificationSettings {
  id: string;
  enabled: number; // 0 or 1
  reminder_time: string; // HH:mm format (e.g. '19:00')
  created_at: string;
  updated_at: string;
}

export async function getSetting(db: DatabaseEngine, key: string): Promise<string | null> {
  const row = await db.querySingle<{ value: string }>('SELECT value FROM settings WHERE key = ?;', [key]);
  return row ? row.value : null;
}

export async function setSetting(db: DatabaseEngine, key: string, value: string): Promise<void> {
  await db.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);', [key, value]);
}

export async function getNotificationSettings(db: DatabaseEngine): Promise<DbNotificationSettings> {
  const settings = await db.querySingle<DbNotificationSettings>(
    "SELECT * FROM notification_settings WHERE id = 'default_notification';"
  );

  if (settings) return settings;

  const now = new Date().toISOString();
  await db.execute(
    `INSERT OR IGNORE INTO notification_settings (id, enabled, reminder_time, created_at, updated_at)
     VALUES ('default_notification', 0, '20:00', ?, ?);`,
    [now, now]
  );

  return {
    id: 'default_notification',
    enabled: 0,
    reminder_time: '20:00',
    created_at: now,
    updated_at: now,
  };
}

export async function updateNotificationSettings(
  db: DatabaseEngine,
  enabled: boolean,
  reminderTime: string
): Promise<DbNotificationSettings> {
  const now = new Date().toISOString();
  const enabledInt = enabled ? 1 : 0;

  await db.execute(
    `UPDATE notification_settings
     SET enabled = ?, reminder_time = ?, updated_at = ?
     WHERE id = 'default_notification';`,
    [enabledInt, reminderTime, now]
  );

  return getNotificationSettings(db);
}
