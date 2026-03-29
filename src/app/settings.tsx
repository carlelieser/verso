import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ControlField, Description, Label, ListGroup } from 'heroui-native';
import React, { useCallback, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenLayout } from '@/components/layout/screen-layout';
import { LibrariesDialog } from '@/components/settings/libraries-dialog';
import { Overline } from '@/components/ui/overline';
import {
	SETTINGS_AUTO_LOCATION_KEY,
	SETTINGS_ONBOARDING_COMPLETE_KEY,
	SETTINGS_TRANSCRIPTION_KEY,
} from '@/constants/settings';
import { type PermissionStatus, usePermissions } from '@/hooks/use-permissions';
import { useSettings } from '@/hooks/use-settings';

import packageJson from '../../package.json';

function getPermissionDescription(
	status: PermissionStatus,
	grantedText: string,
	defaultText: string,
): string {
	switch (status) {
		case 'granted':
			return grantedText;
		case 'denied':
			return 'Denied';
		default:
			return defaultText;
	}
}

function restartOnboarding(): void {
	SecureStore.deleteItemAsync(SETTINGS_ONBOARDING_COMPLETE_KEY).then(() => {
		router.replace('/onboarding');
	});
}

export default function SettingsScreen(): React.JSX.Element {
	const [isAboutOpen, setIsAboutOpen] = useState(false);
	const { isAutoLocation, isTranscriptionEnabled, theme, setSetting, setTheme } = useSettings();
	const permissions = usePermissions();
	const { bottom } = useSafeAreaInsets();
	const isSystemTheme = theme === 'system';
	const isDark = theme === 'dark';

	const handleAutoLocationToggle = useCallback(
		(enabled: boolean) => {
			setSetting(SETTINGS_AUTO_LOCATION_KEY, enabled);
			if (enabled && permissions.location.status !== 'granted') {
				permissions.location.action();
			}
		},
		[permissions.location, setSetting],
	);

	const handleTranscriptionToggle = useCallback(
		(enabled: boolean) => {
			setSetting(SETTINGS_TRANSCRIPTION_KEY, enabled);
			if (enabled && permissions.microphone.status !== 'granted') {
				permissions.microphone.action();
			}
		},
		[permissions.microphone, setSetting],
	);

	return (
		<ScreenLayout title="Settings">
			<ScrollView
				className="rounded-t-4xl overflow-hidden"
				contentContainerClassName="px-6 gap-6"
				contentContainerStyle={{ paddingBottom: bottom }}
			>
				<View className="gap-3">
					<Overline>GENERAL</Overline>

					<ControlField
						isSelected={isAutoLocation}
						onSelectedChange={handleAutoLocationToggle}
					>
						<View className="flex-1">
							<Label>Location tagging</Label>
							<Description>Automatically tag entries with your location</Description>
						</View>
						<ControlField.Indicator />
					</ControlField>

					<ControlField
						isSelected={isTranscriptionEnabled}
						onSelectedChange={handleTranscriptionToggle}
					>
						<View className="flex-1">
							<Label>Voice input</Label>
							<Description>Enable speech-to-text (STT)</Description>
						</View>
						<ControlField.Indicator />
					</ControlField>
				</View>

				<View className="gap-3">
					<Overline>APPEARANCE</Overline>

					<ControlField
						isSelected={isSystemTheme}
						onSelectedChange={(v) => setTheme(v ? 'system' : 'light')}
					>
						<View className="flex-1">
							<Label>Follow system theme</Label>
						</View>
						<ControlField.Indicator />
					</ControlField>

					<ControlField
						isDisabled={isSystemTheme}
						isSelected={isDark}
						onSelectedChange={(v) => setTheme(v ? 'dark' : 'light')}
					>
						<View className="flex-1">
							<Label>Dark mode</Label>
							<Description>Switch between light and dark theme</Description>
						</View>
						<ControlField.Indicator />
					</ControlField>
				</View>

				<View className="gap-3">
					<Overline>PERMISSIONS</Overline>

					<ControlField
						isSelected={permissions.location.status === 'granted'}
						onSelectedChange={permissions.location.action}
					>
						<View className="flex-1">
							<Label>Location</Label>
							<Description>
								{getPermissionDescription(
									permissions.location.status,
									'Granted',
									'Required for location-tagging',
								)}
							</Description>
						</View>
						<ControlField.Indicator />
					</ControlField>

					<ControlField
						isSelected={permissions.microphone.status === 'granted'}
						onSelectedChange={permissions.microphone.action}
					>
						<View className="flex-1">
							<Label>Microphone</Label>
							<Description>
								{getPermissionDescription(
									permissions.microphone.status,
									'Granted',
									'Required for speech-to-text',
								)}
							</Description>
						</View>
						<ControlField.Indicator />
					</ControlField>

					<ControlField
						isSelected={permissions.notification.status === 'granted'}
						onSelectedChange={permissions.notification.action}
					>
						<View className="flex-1">
							<Label>Notifications</Label>
							<Description>
								{getPermissionDescription(
									permissions.notification.status,
									'Granted',
									'Required for reminders',
								)}
							</Description>
						</View>
						<ControlField.Indicator />
					</ControlField>
				</View>

				<View className="gap-3">
					<ListGroup>
						<ListGroup.Item>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>Version</ListGroup.ItemTitle>
								<ListGroup.ItemDescription>
									{packageJson.version}
								</ListGroup.ItemDescription>
							</ListGroup.ItemContent>
						</ListGroup.Item>
						<ListGroup.Item onPress={() => Linking.openURL(packageJson.author.url)}>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>Developer</ListGroup.ItemTitle>
								<ListGroup.ItemDescription>
									{packageJson.author.name}
								</ListGroup.ItemDescription>
							</ListGroup.ItemContent>
							<ListGroup.ItemSuffix />
						</ListGroup.Item>
						<ListGroup.Item onPress={() => setIsAboutOpen(true)}>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>Open source libraries</ListGroup.ItemTitle>
							</ListGroup.ItemContent>
							<ListGroup.ItemSuffix />
						</ListGroup.Item>
						<ListGroup.Item onPress={restartOnboarding}>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>Restart onboarding</ListGroup.ItemTitle>
								<ListGroup.ItemDescription>
									Go through the welcome flow again
								</ListGroup.ItemDescription>
							</ListGroup.ItemContent>
							<ListGroup.ItemSuffix />
						</ListGroup.Item>
					</ListGroup>
				</View>
			</ScrollView>

			<LibrariesDialog isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
		</ScreenLayout>
	);
}
