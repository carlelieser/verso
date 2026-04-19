import * as LocalAuthentication from 'expo-local-authentication';

export type AuthenticationType = LocalAuthentication.AuthenticationType | null;

export interface BiometricCapability {
	readonly isAvailable: boolean;
	readonly type: AuthenticationType;
	readonly label: string;
}

function getAuthenticationTypeLabel(type: AuthenticationType): string {
	switch (type) {
		case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
			return 'Face ID';
		case LocalAuthentication.AuthenticationType.FINGERPRINT:
			return 'Touch ID';
		case LocalAuthentication.AuthenticationType.IRIS:
			return 'Iris';
		default:
			return 'Not available';
	}
}

function getPreferredAuthenticationType(
	types: readonly LocalAuthentication.AuthenticationType[],
): AuthenticationType {
	if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
		return LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION;
	}
	if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
		return LocalAuthentication.AuthenticationType.FINGERPRINT;
	}
	if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
		return LocalAuthentication.AuthenticationType.IRIS;
	}
	return null;
}

export async function getBiometricCapability(): Promise<BiometricCapability> {
	const [hasHardware, isEnrolled, types] = await Promise.all([
		LocalAuthentication.hasHardwareAsync(),
		LocalAuthentication.isEnrolledAsync(),
		LocalAuthentication.supportedAuthenticationTypesAsync(),
	]);
	const isAvailable = hasHardware && isEnrolled && types.length > 0;
	const type = getPreferredAuthenticationType(types);
	const label = getAuthenticationTypeLabel(type);
	return {isAvailable, type, label};
}

export async function authenticateBiometric(reason: string): Promise<boolean> {
	const result = await LocalAuthentication.authenticateAsync({
		promptMessage: reason,
		disableDeviceFallback: true,
		cancelLabel: 'Use PIN',
	});
	return result.success;
}
