import * as Notifications from 'expo-notifications';

const REMINDER_CATEGORY = 'journal-reminder';

interface ScheduleRemindersOptions {
	readonly isEnabled: boolean;
	readonly hour: number;
	readonly minute: number;
	readonly days: readonly number[];
}

/**
 * Cancel all existing journal reminders and reschedule based on current settings.
 * Each selected weekday gets a weekly repeating notification at the given time.
 */
export async function scheduleReminders(options: ScheduleRemindersOptions): Promise<void> {
	await Notifications.cancelAllScheduledNotificationsAsync();

	if (!options.isEnabled || options.days.length === 0) return;

	const { status } = await Notifications.getPermissionsAsync();
	if (status !== 'granted') return;

	await Promise.all(
		options.days.map((weekday) =>
			Notifications.scheduleNotificationAsync({
				content: {
					title: 'Time to journal',
					body: 'Take a moment to write about your day.',
					categoryIdentifier: REMINDER_CATEGORY,
				},
				trigger: {
					type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
					weekday: weekday + 1,
					hour: options.hour,
					minute: options.minute,
				},
			}),
		),
	);
}
