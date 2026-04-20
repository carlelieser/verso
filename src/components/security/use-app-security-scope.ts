import { useCallback, useMemo } from 'react';

import type { SecurityScope } from '@/components/security/security-scope';
import { useSecurity } from '@/hooks/use-security';
import { useConfirmDialog } from '@/providers/dialog-provider';
import { useReauth } from '@/providers/reauth-provider';
import { verifyPin as verifyAppPin } from '@/services/pin-service';

const APP_LABELS = {
	sectionTitle: 'Security',
	pinDescription: 'Tap to change',
	requirePinLabel: 'Require PIN',
	pinRemoveConfirmDescription: 'This will also turn off Require PIN and biometrics.',
	requirePinEnableReason: 'Enable app lock',
	requirePinDisableReason: 'Disable app lock',
	biometricsEnableReason: 'Enable biometrics',
	biometricsDisableReason: 'Disable biometrics',
} as const;

export function useAppSecurityScope(): SecurityScope {
	const {
		hasPin,
		isRequirePin,
		isBiometricsEnabled,
		biometric,
		setPin,
		clearPin,
		setRequirePin,
		setBiometricsEnabled,
	} = useSecurity();
	const { requireAuth } = useReauth();
	const { confirm } = useConfirmDialog();

	const confirmRemovePin = useCallback(
		() =>
			confirm({
				title: 'Remove PIN?',
				description: APP_LABELS.pinRemoveConfirmDescription,
				confirmLabel: 'Remove',
				variant: 'danger',
			}),
		[confirm],
	);

	const setRequirePinAsync = useCallback(
		async (value: boolean): Promise<void> => {
			setRequirePin(value);
		},
		[setRequirePin],
	);

	const setBiometricsEnabledAsync = useCallback(
		async (value: boolean): Promise<void> => {
			setBiometricsEnabled(value);
		},
		[setBiometricsEnabled],
	);

	return useMemo<SecurityScope>(
		() => ({
			hasPin,
			canRequirePin: hasPin,
			isRequirePin,
			isBiometricsEnabled,
			biometric,
			setPin,
			verifyPin: verifyAppPin,
			clearPin,
			setRequirePin: setRequirePinAsync,
			setBiometricsEnabled: setBiometricsEnabledAsync,
			requireAuth,
			confirmRemovePin,
			labels: APP_LABELS,
		}),
		[
			hasPin,
			isRequirePin,
			isBiometricsEnabled,
			biometric,
			setPin,
			clearPin,
			setRequirePinAsync,
			setBiometricsEnabledAsync,
			requireAuth,
			confirmRemovePin,
		],
	);
}
