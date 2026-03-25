import * as ExpoLocation from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { ControlField, Description, Label } from 'heroui-native';
import React, { useCallback, useState } from 'react';
import { Linking, Platform, ScrollView, Text, View } from 'react-native';

import { Overline } from '@/components/overline';
import { ScreenLayout } from '@/components/screen-layout';
import { SETTINGS_AUTO_LOCATION_KEY, SETTINGS_TRANSCRIPTION_KEY } from '@/constants/settings';
import { useSettings } from '@/hooks/use-settings';

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
			return 'Automatically log your location along with journal entries';
		case 'denied':
			return 'Location access was denied. Tap to open system settings';
		default:
			return 'Allow location access for journal entries';
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
	const { isAutoLocation, isTranscriptionEnabled, setSetting } = useSettings();

	const checkPermission = useCallback(async () => {
		const { status } = await ExpoLocation.getForegroundPermissionsAsync();
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

		ExpoLocation.requestForegroundPermissionsAsync().then(({ status }) => {
			const mapped = toPermissionStatus(status);
			setLocationStatus(mapped);
			if (mapped === 'granted') {
				setSetting(SETTINGS_AUTO_LOCATION_KEY, true);
			}
		});
	}, [locationStatus, setSetting]);

	return (
		<ScreenLayout title="Settings">
			<ScrollView contentContainerClassName="px-6 gap-6">
				<View className="gap-3">
					<Overline>GENERAL</Overline>

					<ControlField
						isSelected={isAutoLocation}
						onSelectedChange={(v) => setSetting(SETTINGS_AUTO_LOCATION_KEY, v)}
					>
						<View className="flex-1">
							<Label>Auto-attach location</Label>
							<Description>
								Automatically tag new entries with your current location
							</Description>
						</View>
						<ControlField.Indicator />
					</ControlField>

					<ControlField
						isSelected={isTranscriptionEnabled}
						onSelectedChange={(v) => setSetting(SETTINGS_TRANSCRIPTION_KEY, v)}
					>
						<View className="flex-1">
							<Label>Voice transcription</Label>
							<Description>
								Show a microphone button in the editor for speech-to-text
							</Description>
						</View>
						<ControlField.Indicator />
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
						<ControlField.Indicator />
					</ControlField>
				</View>
			</ScrollView>
		</ScreenLayout>
	);
}
