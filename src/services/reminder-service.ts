import * as Notifications from 'expo-notifications';

const REMINDER_CATEGORY = 'journal-reminder';

/**
 * Cancel all existing journal reminders and reschedule based on current settings.
 * Each selected weekday gets a weekly repeating notification at the given time.
 * Pass an empty days array or enabled=false to cancel all reminders.
 */
export async function scheduleReminders(
	enabled: boolean,
	hour: number,
	minute: number,
	days: readonly number[],
): Promise<void> {
	await Notifications.cancelAllScheduledNotificationsAsync();

	if (!enabled || days.length === 0) return;

	const { granted } = await Notifications.getPermissionsAsync();
	if (!granted) return;

	for (const weekday of days) {
		await Notifications.scheduleNotificationAsync({
			content: {
				title: 'Time to journal',
				body: 'Take a moment to write about your day.',
				categoryIdentifier: REMINDER_CATEGORY,
			},
			trigger: {
				type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
				weekday: weekday + 1, // expo uses 1=Sunday, we use 0=Sunday
				hour,
				minute,
			},
		});
	}
}
