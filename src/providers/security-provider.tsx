import {
	allowScreenCaptureAsync,
	disableAppSwitcherProtectionAsync,
	enableAppSwitcherProtectionAsync,
	preventScreenCaptureAsync,
} from 'expo-screen-capture';
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { SETTINGS_BIOMETRICS_KEY, SETTINGS_REQUIRE_PIN_KEY } from '@/constants/settings';
import { useSettings } from '@/hooks/use-settings';
import {
	type BiometricCapability,
	getBiometricCapability,
} from '@/services/biometric-service';
import {
	clearPin as clearPinStorage,
	hasPin as readHasPin,
	setPin as writePin,
} from '@/services/pin-service';
import { log } from '@/utils/log';

const UNAVAILABLE_BIOMETRIC: BiometricCapability = {
	isAvailable: false,
	type: null,
	label: 'Not available',
};

export interface SecurityContextValue {
	readonly hasPin: boolean;
	readonly isRequirePin: boolean;
	readonly isBiometricsEnabled: boolean;
	readonly biometric: BiometricCapability;
	readonly isLocked: boolean;
	readonly setPin: (pin: string) => Promise<void>;
	readonly clearPin: () => Promise<void>;
	readonly setRequirePin: (value: boolean) => void;
	readonly setBiometricsEnabled: (value: boolean) => void;
	readonly unlock: () => void;
	readonly lock: () => void;
}

export const SecurityContext = createContext<SecurityContextValue | null>(null);

interface SecurityProviderProps {
	readonly children: React.ReactNode;
}

export function SecurityProvider({ children }: SecurityProviderProps): React.JSX.Element {
	const { isRequirePin, isBiometricsEnabled, setSetting } = useSettings();
	const [hasPinState, setHasPinState] = useState<boolean>(readHasPin);
	const [biometric, setBiometric] = useState<BiometricCapability>(UNAVAILABLE_BIOMETRIC);
	const [isLocked, setIsLocked] = useState<boolean>(isRequirePin);

	useEffect(() => {
		getBiometricCapability()
			.then(setBiometric)
			.catch((err: unknown) => {
				log.warn('security', 'Failed to probe biometrics', err);
				setBiometric(UNAVAILABLE_BIOMETRIC);
			});
	}, []);

	useEffect(() => {
		const shouldProtect = isRequirePin && hasPinState;
		const capture = shouldProtect ? preventScreenCaptureAsync : allowScreenCaptureAsync;
		capture().catch((err: unknown) => {
			log.warn('security', 'Failed to toggle screen capture', err);
		});
		if (Platform.OS === 'ios') {
			const switcher = shouldProtect
				? enableAppSwitcherProtectionAsync
				: disableAppSwitcherProtectionAsync;
			switcher().catch((err: unknown) => {
				log.warn('security', 'Failed to toggle app switcher protection', err);
			});
		}
	}, [isRequirePin, hasPinState]);

	useEffect(() => {
		const sub = AppState.addEventListener('change', (state) => {
			if (state === 'active' && isRequirePin) setIsLocked(true);
		});
		return () => sub.remove();
	}, [isRequirePin]);

	const setRequirePin = useCallback(
		(value: boolean) => {
			setSetting(SETTINGS_REQUIRE_PIN_KEY, value);
			if (!value) setSetting(SETTINGS_BIOMETRICS_KEY, false);
		},
		[setSetting],
	);

	const setBiometricsEnabled = useCallback(
		(value: boolean) => {
			setSetting(SETTINGS_BIOMETRICS_KEY, value);
		},
		[setSetting],
	);

	const setPin = useCallback(async (pin: string) => {
		await writePin(pin);
		setHasPinState(true);
	}, []);

	const clearPin = useCallback(async () => {
		await clearPinStorage();
		setHasPinState(false);
		setSetting(SETTINGS_REQUIRE_PIN_KEY, false);
		setSetting(SETTINGS_BIOMETRICS_KEY, false);
	}, [setSetting]);

	const unlock = useCallback(() => setIsLocked(false), []);
	const lock = useCallback(() => setIsLocked(true), []);

	const value = useMemo<SecurityContextValue>(
		() => ({
			hasPin: hasPinState,
			isRequirePin,
			isBiometricsEnabled,
			biometric,
			isLocked,
			setPin,
			clearPin,
			setRequirePin,
			setBiometricsEnabled,
			unlock,
			lock,
		}),
		[
			hasPinState,
			isRequirePin,
			isBiometricsEnabled,
			biometric,
			isLocked,
			setPin,
			clearPin,
			setRequirePin,
			setBiometricsEnabled,
			unlock,
			lock,
		],
	);

	return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
}
