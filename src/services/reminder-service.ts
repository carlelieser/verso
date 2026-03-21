import * as Notifications from 'expo-notifications';
import { eq } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import { reminders } from '@/db/schema';
import { generateId } from '@/utils/id';

interface ReminderConfig {
  readonly id: string;
  readonly userId: string;
  readonly isEnabled: boolean;
  readonly hour: number;
  readonly minute: number;
}

interface SetReminderParams {
  readonly hour: number;
  readonly minute: number;
}

const NOTIFICATION_IDENTIFIER = 'daily-journal-reminder';

function buildNotificationContent({ daysSinceLastEntry }: { daysSinceLastEntry: number }): {
  title: string;
  body: string;
} {
  if (daysSinceLastEntry === 0) {
    return {
      title: 'Time to reflect',
      body: 'Take a moment to write about your day.',
    };
  }

  if (daysSinceLastEntry === 1) {
    return {
      title: 'Keep the streak going',
      body: "You wrote yesterday -- let's make it two in a row.",
    };
  }

  if (daysSinceLastEntry <= 3) {
    return {
      title: 'Your journal misses you',
      body: `It's been ${daysSinceLastEntry} days. Even a few words can help.`,
    };
  }

  return {
    title: 'Welcome back',
    body: `It's been ${daysSinceLastEntry} days since your last entry. No pressure -- just start writing.`,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createReminderService(db: ExpoSQLiteDatabase<any>): {
  getConfig: (userId: string) => Promise<ReminderConfig | undefined>;
  setReminder: (userId: string, params: SetReminderParams) => Promise<ReminderConfig>;
  disable: (userId: string) => Promise<void>;
  getNotificationContent: (params: { daysSinceLastEntry: number }) => { title: string; body: string };
} {
  return {
    async getConfig(userId): Promise<ReminderConfig | undefined> {
      const rows = await db
        .select()
        .from(reminders)
        .where(eq(reminders.userId, userId))
        .limit(1);

      const row = rows[0];
      if (!row) {
        return undefined;
      }

      return {
        id: row.id,
        userId: row.userId,
        isEnabled: row.isEnabled,
        hour: row.hour,
        minute: row.minute,
      };
    },

    async setReminder(userId, { hour, minute }): Promise<ReminderConfig> {
      await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDENTIFIER);

      const existing = await db
        .select()
        .from(reminders)
        .where(eq(reminders.userId, userId))
        .limit(1);

      const now = new Date();
      let config: ReminderConfig;

      if (existing[0]) {
        await db
          .update(reminders)
          .set({
            isEnabled: true,
            hour,
            minute,
            updatedAt: now,
          })
          .where(eq(reminders.userId, userId));

        config = {
          id: existing[0].id,
          userId,
          isEnabled: true,
          hour,
          minute,
        };
      } else {
        const id = generateId();

        await db.insert(reminders).values({
          id,
          userId,
          isEnabled: true,
          hour,
          minute,
          updatedAt: now,
        });

        config = { id, userId, isEnabled: true, hour, minute };
      }

      const content = buildNotificationContent({ daysSinceLastEntry: 0 });

      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_IDENTIFIER,
        content: {
          title: content.title,
          body: content.body,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });

      return config;
    },

    async disable(userId): Promise<void> {
      await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_IDENTIFIER);

      await db
        .update(reminders)
        .set({ isEnabled: false, updatedAt: new Date() })
        .where(eq(reminders.userId, userId));
    },

    getNotificationContent: buildNotificationContent,
  };
}
