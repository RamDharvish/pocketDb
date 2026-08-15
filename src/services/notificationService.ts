/**
 * Local Notification Service
 * Manages daily reminder notifications using Web Notifications API / browser timers.
 */

export class NotificationService {
  private reminderTimerId: number | null = null;

  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this environment');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  public scheduleDailyReminder(timeHHMM: string): void {
    this.cancelDailyReminder();

    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const [hours, minutes] = timeHHMM.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    if (scheduledTime.getTime() <= now.getTime()) {
      // If time has passed today, schedule for tomorrow
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delayMs = scheduledTime.getTime() - now.getTime();

    this.reminderTimerId = window.setTimeout(() => {
      this.triggerReminderNotification();
      // Reschedule for next day (24h)
      this.scheduleDailyReminder(timeHHMM);
    }, delayMs);
  }

  public cancelDailyReminder(): void {
    if (this.reminderTimerId !== null) {
      window.clearTimeout(this.reminderTimerId);
      this.reminderTimerId = null;
    }
  }

  public triggerReminderNotification(): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    new Notification('PocketDB Daily Ledger 📝', {
      body: "Don't forget to record today's financial entries in your local database.",
      icon: '/favicon.ico',
      tag: 'daily-pocketdb-reminder',
    });
  }
}

export const notificationService = new NotificationService();
