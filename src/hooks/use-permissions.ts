import * as ExpoAudio from 'expo-audio';
import * as ExpoLocation from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

export interface Permission {
	readonly status: PermissionStatus;
	readonly request: () => Promise<boolean>;
	readonly action: () => void;
}

interface UsePermissionsResult {
	readonly location: Permission;
	readonly microphone: Permission;
	readonly notification: Permission;
}

function toStatus(granted: boolean, canAskAgain: boolean): PermissionStatus {
	if (granted) return 'granted';
	if (canAskAgain) return 'undetermined';
	return 'denied';
}

function openAppSettings(): void {
	if (Platform.OS === 'ios') {
		Linking.openURL('app-settings:');
	} else {
		Linking.openSettings();
	}
}

export function usePermissions(): UsePermissionsResult {
	const [locationStatus, setLocationStatus] = useState<PermissionStatus>('undetermined');
	const [microphoneStatus, setMicrophoneStatus] = useState<PermissionStatus>('undetermined');
	const [notificationStatus, setNotificationStatus] = useState<PermissionStatus>('undetermined');

	const check = useCallback(async () => {
		const [location, microphone, notification] = await Promise.all([
			ExpoLocation.getForegroundPermissionsAsync(),
			ExpoAudio.getRecordingPermissionsAsync(),
			Notifications.getPermissionsAsync(),
		]);
		setLocationStatus(toStatus(location.granted, location.canAskAgain));
		setMicrophoneStatus(toStatus(microphone.granted, microphone.canAskAgain));
		setNotificationStatus(toStatus(notification.granted, notification.canAskAgain));
	}, []);

	useEffect(() => {
		check();
		const sub = AppState.addEventListener('change', (state) => {
			if (state === 'active') check();
		});
		return () => sub.remove();
	}, [check]);

	const requestLocation = useCallback(async (): Promise<boolean> => {
		const { granted, canAskAgain } = await ExpoLocation.requestForegroundPermissionsAsync();
		setLocationStatus(toStatus(granted, canAskAgain));
		return granted;
	}, []);

	const requestMicrophone = useCallback(async (): Promise<boolean> => {
		const { granted, canAskAgain } = await ExpoAudio.requestRecordingPermissionsAsync();
		setMicrophoneStatus(toStatus(granted, canAskAgain));
		return granted;
	}, []);

	const requestNotification = useCallback(async (): Promise<boolean> => {
		const { granted, canAskAgain } = await Notifications.requestPermissionsAsync();
		setNotificationStatus(toStatus(granted, canAskAgain));
		return granted;
	}, []);

	const location = useMemo<Permission>(
		() => ({
			status: locationStatus,
			request: requestLocation,
			action: locationStatus === 'undetermined' ? requestLocation : openAppSettings,
		}),
		[locationStatus, requestLocation],
	);

	const microphone = useMemo<Permission>(
		() => ({
			status: microphoneStatus,
			request: requestMicrophone,
			action: microphoneStatus === 'undetermined' ? requestMicrophone : openAppSettings,
		}),
		[microphoneStatus, requestMicrophone],
	);

	const notification = useMemo<Permission>(
		() => ({
			status: notificationStatus,
			request: requestNotification,
			action: notificationStatus === 'undetermined' ? requestNotification : openAppSettings,
		}),
		[notificationStatus, requestNotification],
	);

	return { location, microphone, notification };
}
