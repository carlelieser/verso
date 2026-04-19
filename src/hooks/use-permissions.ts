import * as ExpoAudio from 'expo-audio';
import * as ExpoLocation from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

type PermissionFn = () => Promise<{ status: string }>;

function toStatus(result: { status: string }): PermissionStatus {
	if (result.status === 'granted') return 'granted';
	if (result.status === 'undetermined') return 'undetermined';
	return 'denied';
}

function isGranted(result: { status: string }): boolean {
	return result.status === 'granted';
}

function openAppSettings(): void {
	if (Platform.OS === 'ios') {
		Linking.openURL('app-settings:');
	} else {
		Linking.openSettings();
	}
}

function usePermission(checkFn: PermissionFn, requestFn: PermissionFn): Permission {
	const [status, setStatus] = useState<PermissionStatus>('undetermined');
	const checkRef = useRef(checkFn);
	checkRef.current = checkFn;

	useEffect(() => {
		checkRef.current().then((result) => setStatus(toStatus(result)));
		const sub = AppState.addEventListener('change', (state) => {
			if (state === 'active') {
				checkRef.current().then((result) => setStatus(toStatus(result)));
			}
		});
		return () => sub.remove();
	}, []);

	const request = useCallback(async (): Promise<boolean> => {
		const result = await requestFn();
		setStatus(toStatus(result));
		return isGranted(result);
	}, [requestFn]);

	return useMemo<Permission>(
		() => ({
			status,
			request,
			action: status === 'undetermined' ? request : openAppSettings,
		}),
		[status, request],
	);
}

export function usePermissions(): UsePermissionsResult {
	const location = usePermission(
		useCallback(() => ExpoLocation.getForegroundPermissionsAsync(), []),
		useCallback(() => ExpoLocation.requestForegroundPermissionsAsync(), []),
	);

	const microphone = usePermission(
		useCallback(() => ExpoAudio.getRecordingPermissionsAsync(), []),
		useCallback(() => ExpoAudio.requestRecordingPermissionsAsync(), []),
	);

	const notification = usePermission(
		useCallback(() => Notifications.getPermissionsAsync(), []),
		useCallback(() => Notifications.requestPermissionsAsync(), []),
	);

	return { location, microphone, notification };
}
