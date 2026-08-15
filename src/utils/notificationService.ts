import { LocalNotifications, PermissionStatus } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const REMINDER_NOTIFICATION_ID = 1001;
export const REMINDER_CHANNEL_ID = 'daily-expense-reminder';

export interface NotificationPermissionState {
  granted: boolean;
  canRequest: boolean;
}

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export async function checkNotificationPermissions(): Promise<NotificationPermissionState> {
  if (!Capacitor.isNativePlatform()) {
    return { granted: true, canRequest: false };
  }
  try {
    const status: PermissionStatus = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') {
      return { granted: true, canRequest: false };
    }
    return {
      granted: false,
      canRequest: status.display === 'prompt' || status.display === 'prompt-with-rationale',
    };
  } catch (e) {
    console.error('Error checking notification permissions:', e);
    return { granted: false, canRequest: true };
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return true;
  }
  try {
    const status = await LocalNotifications.requestPermissions();
    return status.display === 'granted';
  } catch (e) {
    console.error('Error requesting notification permissions:', e);
    return false;
  }
}

export async function createNotificationChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.createChannel({
      id: REMINDER_CHANNEL_ID,
      name: 'Daily Expense Reminder',
      description: 'Daily reminder to review and record expenses',
      importance: 3, // Normal importance
      visibility: 1, // Public
    });
  } catch (e) {
    console.error('Error creating notification channel:', e);
  }
}

export async function cancelDailyReminder(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: REMINDER_NOTIFICATION_ID }],
    });
  } catch (e) {
    console.error('Error cancelling daily reminder:', e);
  }
}

export async function scheduleDailyReminder(timeHHmm: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;

  try {
    const [hoursStr, minutesStr] = timeHHmm.split(':');
    const hour = parseInt(hoursStr, 10);
    const minute = parseInt(minutesStr, 10);

    if (isNaN(hour) || isNaN(minute)) {
      console.error('Invalid time format for notification:', timeHHmm);
      return false;
    }

    const perm = await checkNotificationPermissions();
    if (!perm.granted) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        console.warn('Notification permission not granted');
        return false;
      }
    }

    await createNotificationChannel();
    await cancelDailyReminder();

    await LocalNotifications.schedule({
      notifications: [
        {
          id: REMINDER_NOTIFICATION_ID,
          title: 'Daily Expense Review',
          body: 'Take a minute to review and record your financial transactions!',
          channelId: REMINDER_CHANNEL_ID,
          schedule: {
            on: {
              hour,
              minute,
            },
            repeats: true,
            allowWhileIdle: true,
          },
        },
      ],
    });

    return true;
  } catch (e) {
    console.error('Error scheduling daily reminder:', e);
    return false;
  }
}

export async function syncDailyReminder(enabled: boolean, timeHHmm: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  if (enabled) {
    await scheduleDailyReminder(timeHHmm);
  } else {
    await cancelDailyReminder();
  }
}
