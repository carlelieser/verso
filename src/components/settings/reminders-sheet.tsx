import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import { ControlField } from 'heroui-native';
import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { SelectablePill } from '@/components/ui/selectable-pill';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TimePickerDialog } from '@/components/ui/time-picker-dialog';
import { SETTINGS_REMINDERS_ENABLED_KEY } from '@/constants/settings';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useSettings } from '@/hooks/use-settings';
import { scheduleReminders } from '@/services/reminder-service';
import { formatTime12 } from '@/utils/format-time';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

interface RemindersSheetProps {
	readonly sheet: ReturnType<typeof useBottomSheet>;
}

export function RemindersSheet({ sheet }: RemindersSheetProps): React.JSX.Element {
	const { bottom } = useSafeAreaInsets();
	const { reminders, setSetting, setReminderTime, setReminderDays } = useSettings();
	const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

	const reschedule = useCallback(
		(overrides: { isEnabled?: boolean; hour?: number; minute?: number; days?: readonly number[] } = {}) => {
			scheduleReminders(
				overrides.isEnabled ?? reminders.isEnabled,
				overrides.hour ?? reminders.hour,
				overrides.minute ?? reminders.minute,
				overrides.days ?? reminders.days,
			);
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
		<Portal>
			<BottomSheet ref={sheet.ref} {...sheet.sheetProps}>
				<BottomSheetScrollView>
					<View className="p-6 gap-6" style={{ paddingBottom: bottom + 16 }}>
						<Text className="text-3xl font-heading text-foreground">
							Reminders
						</Text>

						<View className="flex-row items-center justify-between">
							<Pressable
								onPress={() => setIsTimePickerOpen(true)}
								className="flex-row items-baseline gap-1"
							>
								<Text className="text-5xl text-foreground">
									{formatted.time}
								</Text>
								<Text className="text-base text-muted">
									{formatted.period}
								</Text>
							</Pressable>
							<ControlField isSelected={reminders.isEnabled} onSelectedChange={handleToggle}>
								<ControlField.Indicator />
							</ControlField>
						</View>

						<View className="gap-2">
							<View className="flex-row gap-2">
								{DAY_LABELS.map((label, index) => (
									<SelectablePill
										key={index}
										label={label}
										isSelected={reminders.days.includes(index)}
										onPress={() => handleDayToggle(index)}
										className="flex-1 items-center justify-center py-3"
									/>
								))}
							</View>
						</View>
					</View>
				</BottomSheetScrollView>
			</BottomSheet>

			<TimePickerDialog
				isOpen={isTimePickerOpen}
				initialHour={reminders.hour}
				initialMinute={reminders.minute}
				onConfirm={handleTimeConfirm}
				onClose={() => setIsTimePickerOpen(false)}
			/>
		</Portal>
	);
}
