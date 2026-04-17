import { ControlField, ListGroup, Separator } from 'heroui-native';
import { Bell, Heart, MapPin } from 'lucide-react-native';
import React, { useCallback } from 'react';

import { Section } from '@/components/layout/section';
import { RemindersSheet } from '@/components/settings/reminders-sheet';
import { VoiceInputSetting } from '@/components/settings/voice-input-setting';
import {
	SETTINGS_AUTO_LOCATION_KEY,
	SETTINGS_SHOW_DONATION_BANNER_KEY,
} from '@/constants/settings';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { usePermissions } from '@/hooks/use-permissions';
import { useSettings } from '@/hooks/use-settings';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { formatTime12 } from '@/utils/format-time';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKENDS = [0, 6];

function formatDaySchedule(days: readonly number[]): string {
	if (days.length === 7) return 'Daily';
	if (days.length === 5 && WEEKDAYS.every((d) => days.includes(d))) return 'Weekdays';
	if (days.length === 2 && WEEKENDS.every((d) => days.includes(d))) return 'Weekends';
	const sorted = [...days].sort();
	return sorted.map((d) => DAY_NAMES[d]).join(', ');
}

function formatReminderDescription(reminders: {
	readonly isEnabled: boolean;
	readonly hour: number;
	readonly minute: number;
	readonly days: readonly number[];
}): string {
	if (!reminders.isEnabled) return 'Off';
	if (reminders.days.length === 0) return 'No days selected';
	const { time, period } = formatTime12(reminders.hour, reminders.minute);
	return `${formatDaySchedule(reminders.days)} at ${time} ${period}`;
}

export function GeneralSection(): React.JSX.Element {
	const { muted } = useThemeColors();
	const { isAutoLocation, shouldShowDonationBanner, reminders, setSetting } = useSettings();
	const { location: locationPermission } = usePermissions();
	const remindersSheet = useBottomSheet();

	const handleAutoLocationToggle = useCallback(
		(enabled: boolean) => {
			setSetting(SETTINGS_AUTO_LOCATION_KEY, enabled);
			if (enabled && locationPermission.status !== 'granted') {
				locationPermission.action();
			}
		},
		[locationPermission, setSetting],
	);

	const handleDonationBannerToggle = useCallback(
		(enabled: boolean) => {
			setSetting(SETTINGS_SHOW_DONATION_BANNER_KEY, enabled);
		},
		[setSetting],
	);

	return (
		<Section label="General">
			<ListGroup>
				<ControlField
					isSelected={isAutoLocation}
					onSelectedChange={handleAutoLocationToggle}
				>
					<ListGroup.Item>
						<ListGroup.ItemPrefix>
							<MapPin size={20} color={muted} />
						</ListGroup.ItemPrefix>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Location tagging</ListGroup.ItemTitle>
							<ListGroup.ItemDescription>
								Automatically tag entries with your location
							</ListGroup.ItemDescription>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<ControlField.Indicator />
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
				</ControlField>
				<Separator className="mx-4" />
				<VoiceInputSetting />
				<Separator className="mx-4" />
				<ListGroup.Item onPress={remindersSheet.open}>
					<ListGroup.ItemPrefix>
						<Bell size={20} color={muted} />
					</ListGroup.ItemPrefix>
					<ListGroup.ItemContent>
						<ListGroup.ItemTitle>Reminders</ListGroup.ItemTitle>
						<ListGroup.ItemDescription>
							{formatReminderDescription(reminders)}
						</ListGroup.ItemDescription>
					</ListGroup.ItemContent>
					<ListGroup.ItemSuffix />
				</ListGroup.Item>
				<Separator className="mx-4" />
				<ControlField
					isSelected={shouldShowDonationBanner}
					onSelectedChange={handleDonationBannerToggle}
				>
					<ListGroup.Item>
						<ListGroup.ItemPrefix>
							<Heart size={20} color={muted} />
						</ListGroup.ItemPrefix>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Donation banner</ListGroup.ItemTitle>
							<ListGroup.ItemDescription>
								{shouldShowDonationBanner ? 'Visible' : 'Hidden'}
							</ListGroup.ItemDescription>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<ControlField.Indicator />
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
				</ControlField>
			</ListGroup>

			{remindersSheet.isOpen ? <RemindersSheet sheet={remindersSheet} /> : null}
		</Section>
	);
}
