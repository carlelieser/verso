import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import * as ExpoLocation from 'expo-location';
import * as Notifications from 'expo-notifications';
import {router, useFocusEffect} from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {ControlField, Description, Label, ListGroup} from 'heroui-native';
import React, {useCallback, useState} from 'react';
import {Linking, Platform, ScrollView, View} from 'react-native';

import {LibrariesDialog} from '@/components/libraries-dialog';
import {Overline} from '@/components/overline';
import {ScreenLayout} from '@/components/screen-layout';
import {
	SETTINGS_AUTO_LOCATION_KEY,
	SETTINGS_ONBOARDING_COMPLETE_KEY,
	SETTINGS_TRANSCRIPTION_KEY,
} from '@/constants/settings';
import {useSettings} from '@/hooks/use-settings';

import packageJson from '../../package.json';
import {useSafeAreaInsets} from "react-native-safe-area-context";

type PermissionStatus = 'undetermined' | 'granted' | 'denied';

function toPermissionStatus(status: ExpoLocation.PermissionStatus): PermissionStatus {
	switch (status) {
		case ExpoLocation.PermissionStatus.GRANTED:
			return 'granted';
		case ExpoLocation.PermissionStatus.DENIED:
			return 'denied';
		default:
			return 'undetermined';
	}
}

function getPermissionDescription(
	status: PermissionStatus | null,
	grantedText: string,
	requiredText: string,
): string {
	if (status === null) return requiredText;
	switch (status) {
		case 'granted':
			return grantedText;
		case 'denied':
			return 'Access denied — tap to open system settings';
		default:
			return requiredText;
	}
}

function openAppSettings(): void {
	if (Platform.OS === 'ios') {
		Linking.openURL('app-settings:');
	} else {
		Linking.openSettings();
	}
}

export default function SettingsScreen(): React.JSX.Element {
	const [locationStatus, setLocationStatus] = useState<PermissionStatus | null>(null);
	const [microphoneStatus, setMicrophoneStatus] = useState<PermissionStatus | null>(null);
	const [notificationStatus, setNotificationStatus] = useState<PermissionStatus | null>(null);
	const [isAboutOpen, setIsAboutOpen] = useState(false);
	const {isAutoLocation, isTranscriptionEnabled, theme, setSetting, setTheme} = useSettings();
	const {bottom} = useSafeAreaInsets();
	const isSystemTheme = theme === 'system';
	const isDark = theme === 'dark';

	const checkPermissions = useCallback(async () => {
		const [location, microphone, notification] = await Promise.all([
			ExpoLocation.getForegroundPermissionsAsync(),
			getRecordingPermissionsAsync(),
			Notifications.getPermissionsAsync(),
		]);
		setLocationStatus(toPermissionStatus(location.status));
		setMicrophoneStatus(
			microphone.granted ? 'granted' : microphone.canAskAgain ? 'undetermined' : 'denied',
		);
		setNotificationStatus(
			notification.granted ? 'granted' : notification.canAskAgain ? 'undetermined' : 'denied',
		);
	}, []);

	useFocusEffect(
		useCallback(() => {
			checkPermissions();
		}, [checkPermissions]),
	);

	const handleLocationToggle = useCallback(() => {
		if (locationStatus === 'granted' || locationStatus === 'denied') {
			openAppSettings();
			return;
		}

		ExpoLocation.requestForegroundPermissionsAsync().then(({status}) => {
			const mapped = toPermissionStatus(status);
			setLocationStatus(mapped);
			if (mapped === 'granted') {
				setSetting(SETTINGS_AUTO_LOCATION_KEY, true);
			}
		});
	}, [locationStatus, setSetting]);

	const handleMicrophoneToggle = useCallback(() => {
		if (microphoneStatus === 'granted' || microphoneStatus === 'denied') {
			openAppSettings();
			return;
		}

		requestRecordingPermissionsAsync().then(({granted}) => {
			setMicrophoneStatus(granted ? 'granted' : 'denied');
		});
	}, [microphoneStatus]);

	const handleNotificationToggle = useCallback(() => {
		if (notificationStatus === 'granted' || notificationStatus === 'denied') {
			openAppSettings();
			return;
		}

		Notifications.requestPermissionsAsync().then(({granted}) => {
			setNotificationStatus(granted ? 'granted' : 'denied');
		});
	}, [notificationStatus]);

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
						onSelectedChange={(v) => setSetting(SETTINGS_AUTO_LOCATION_KEY, v)}
					>
						<View className="flex-1">
							<Label>Location tagging</Label>
							<Description>Automatically tag entries with your location</Description>
						</View>
						<ControlField.Indicator/>
					</ControlField>

					<ControlField
						isSelected={isTranscriptionEnabled}
						onSelectedChange={(v) => setSetting(SETTINGS_TRANSCRIPTION_KEY, v)}
					>
						<View className="flex-1">
							<Label>Voice input</Label>
							<Description>Enable speech-to-text (STT)</Description>
						</View>
						<ControlField.Indicator/>
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
						<ControlField.Indicator/>
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
						<ControlField.Indicator/>
					</ControlField>
				</View>

				<View className="gap-3">
					<Overline>PERMISSIONS</Overline>

					<ControlField
						isSelected={locationStatus === 'granted'}
						onSelectedChange={handleLocationToggle}
					>
						<View className="flex-1">
							<Label>Location</Label>
							<Description>
								{getPermissionDescription(
									locationStatus,
									'Location access is enabled',
									'Required for saving location with entries',
								)}
							</Description>
						</View>
						<ControlField.Indicator/>
					</ControlField>

					<ControlField
						isSelected={microphoneStatus === 'granted'}
						onSelectedChange={handleMicrophoneToggle}
					>
						<View className="flex-1">
							<Label>Microphone</Label>
							<Description>
								{getPermissionDescription(
									microphoneStatus,
									'Microphone access is enabled',
									'Required for voice-to-text input',
								)}
							</Description>
						</View>
						<ControlField.Indicator/>
					</ControlField>

					<ControlField
						isSelected={notificationStatus === 'granted'}
						onSelectedChange={handleNotificationToggle}
					>
						<View className="flex-1">
							<Label>Notifications</Label>
							<Description>
								{getPermissionDescription(
									notificationStatus,
									'Notifications are enabled',
									'Required for journaling reminders',
								)}
							</Description>
						</View>
						<ControlField.Indicator/>
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
							<ListGroup.ItemSuffix/>
						</ListGroup.Item>
						<ListGroup.Item onPress={() => setIsAboutOpen(true)}>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>Open source libraries</ListGroup.ItemTitle>
							</ListGroup.ItemContent>
							<ListGroup.ItemSuffix/>
						</ListGroup.Item>
						<ListGroup.Item
							onPress={() => {
								SecureStore.deleteItemAsync(SETTINGS_ONBOARDING_COMPLETE_KEY).then(
									() => {
										router.replace('/onboarding');
									},
								);
							}}
						>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>Restart onboarding</ListGroup.ItemTitle>
								<ListGroup.ItemDescription>
									Go through the welcome flow again
								</ListGroup.ItemDescription>
							</ListGroup.ItemContent>
							<ListGroup.ItemSuffix/>
						</ListGroup.Item>
					</ListGroup>
				</View>
			</ScrollView>

			<LibrariesDialog isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)}/>
		</ScreenLayout>
	);
}
