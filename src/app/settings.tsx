import * as ExpoLocation from 'expo-location';
import {useFocusEffect} from 'expo-router';
import {ControlField, Description, Label} from 'heroui-native';
import React, {useCallback, useState} from 'react';
import {Linking, Platform, ScrollView, View} from 'react-native';

import {Overline} from '@/components/overline';
import {ScreenLayout} from '@/components/screen-layout';
import {SETTINGS_AUTO_LOCATION_KEY, SETTINGS_TRANSCRIPTION_KEY} from '@/constants/settings';
import {useSettings} from '@/hooks/use-settings';

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

function getLocationDescription(status: PermissionStatus): string {
	switch (status) {
		case 'granted':
			return 'Location access is enabled';
		case 'denied':
			return 'Access denied — tap to open system settings';
		default:
			return 'Required for saving location with entries';
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
	const [locationStatus, setLocationStatus] = useState<PermissionStatus>('undetermined');
	const {isAutoLocation, isTranscriptionEnabled, theme, setSetting, setTheme} = useSettings();
	const isSystemTheme = theme === 'system';
	const isDark = theme === 'dark';

	const checkPermission = useCallback(async () => {
		const {status} = await ExpoLocation.getForegroundPermissionsAsync();
		setLocationStatus(toPermissionStatus(status));
	}, []);

	useFocusEffect(
		useCallback(() => {
			checkPermission();
		}, [checkPermission]),
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

	return (
		<ScreenLayout title="Settings">
			<ScrollView className="rounded-t-4xl overflow-hidden" contentContainerClassName="px-6 gap-6">
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
					<Overline>GENERAL</Overline>

					<ControlField
						isSelected={isAutoLocation}
						onSelectedChange={(v) => setSetting(SETTINGS_AUTO_LOCATION_KEY, v)}
					>
						<View className="flex-1">
							<Label>Location tagging</Label>
							<Description>
								Automatically tag entries with your location
							</Description>
						</View>
						<ControlField.Indicator/>
					</ControlField>

					<ControlField
						isSelected={isTranscriptionEnabled}
						onSelectedChange={(v) => setSetting(SETTINGS_TRANSCRIPTION_KEY, v)}
					>
						<View className="flex-1">
							<Label>Voice input</Label>
							<Description>
								Enable speech-to-text (STT)
							</Description>
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
							<Description>{getLocationDescription(locationStatus)}</Description>
						</View>
						<ControlField.Indicator/>
					</ControlField>
				</View>
			</ScrollView>
		</ScreenLayout>
	);
}
