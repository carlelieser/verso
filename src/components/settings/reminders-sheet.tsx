import { Portal } from '@gorhom/portal';
import { ControlField } from 'heroui-native';
import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { PortalSheet } from '@/components/ui/portal-sheet';
import { SelectablePill } from '@/components/ui/selectable-pill';
import { TimePickerDialog } from '@/components/ui/time-picker-dialog';
import { SETTINGS_REMINDERS_ENABLED_KEY } from '@/constants/settings';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useSettings } from '@/hooks/use-settings';
import { scheduleReminders } from '@/services/reminder-service';
import { formatTime12 } from '@/utils/format-time';
import { log } from '@/utils/log';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

interface RemindersSheetProps {
	readonly sheet: ReturnType<typeof useBottomSheet>;
}

export function RemindersSheet({ sheet }: RemindersSheetProps): React.JSX.Element {
	const { reminders, setSetting, setReminderTime, setReminderDays } = useSettings();
	const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

	const reschedule = useCallback(
		(
			overrides: {
				isEnabled?: boolean;
				hour?: number;
				minute?: number;
				days?: readonly number[];
			} = {},
		) => {
			scheduleReminders({
				isEnabled: overrides.isEnabled ?? reminders.isEnabled,
				hour: overrides.hour ?? reminders.hour,
				minute: overrides.minute ?? reminders.minute,
				days: overrides.days ?? reminders.days,
			}).catch((err: unknown) => {
				log.warn('reminders', 'Failed to schedule reminders', err);
			});
		},
		[reminders],
	);

	const handleToggle = useCallback(
		(enabled: boolean) => {
			setSetting(SETTINGS_REMINDERS_ENABLED_KEY, enabled);
			reschedule({ isEnabled: enabled });
		},
		[setSetting, reschedule],
	);

	const handleTimeConfirm = useCallback(
		(hour: number, minute: number) => {
			setReminderTime(hour, minute);
			reschedule({ hour, minute });
		},
		[setReminderTime, reschedule],
	);

	const handleDayToggle = useCallback(
		(day: number) => {
			const next = reminders.days.includes(day)
				? reminders.days.filter((d) => d !== day)
				: [...reminders.days, day].sort();
			setReminderDays(next);
			reschedule({ days: next });
		},
		[reminders.days, setReminderDays, reschedule],
	);

	const formatted = formatTime12(reminders.hour, reminders.minute);

	return (
		<>
			<PortalSheet sheet={sheet} title="Reminders">
				<View className="flex-row items-center justify-between">
					<Pressable
						onPress={() => setIsTimePickerOpen(true)}
						className={`flex-row items-baseline gap-1 ${
							reminders.isEnabled ? '' : 'opacity-50 pointer-events-none'
						}`}
					>
						<Text className="text-5xl text-foreground">{formatted.time}</Text>
						<Text className="text-base text-muted">{formatted.period}</Text>
					</Pressable>
					<ControlField isSelected={reminders.isEnabled} onSelectedChange={handleToggle}>
						<ControlField.Indicator />
					</ControlField>
				</View>

				<View className="flex-row gap-2 mb-8">
					{DAY_LABELS.map((label, index) => (
						<SelectablePill
							key={index}
							label={label}
							isSelected={reminders.days.includes(index)}
							onPress={() => handleDayToggle(index)}
							className="flex-1 items-center justify-center p-3"
						/>
					))}
				</View>
			</PortalSheet>

			<Portal>
				<TimePickerDialog
					isOpen={isTimePickerOpen}
					initialHour={reminders.hour}
					initialMinute={reminders.minute}
					onConfirm={handleTimeConfirm}
					onClose={() => setIsTimePickerOpen(false)}
				/>
			</Portal>
		</>
	);
}
