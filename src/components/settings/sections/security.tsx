import { ControlField, ListGroup, Separator } from 'heroui-native';
import { Asterisk, ChevronRight, Fingerprint, Lock } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';

import { Section } from '@/components/layout/section';
import { type PinSheetMode, PinSheet } from '@/components/security/pin-sheet';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useSecurity } from '@/hooks/use-security';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useConfirmDialog } from '@/providers/dialog-provider';
import { useReauth } from '@/providers/reauth-provider';
import { log } from '@/utils/log';

export function SecuritySection(): React.JSX.Element {
	const { muted } = useThemeColors();
	const {
		hasPin,
		isRequirePin,
		isBiometricsEnabled,
		biometric,
		setRequirePin,
		setBiometricsEnabled,
		clearPin,
	} = useSecurity();
	const { requireAuth } = useReauth();
	const { confirm } = useConfirmDialog();

	const pinSheet = useBottomSheet();
	const [pinMode, setPinMode] = useState<PinSheetMode>('set');

	const openPinFlow = useCallback(async () => {
		if (!hasPin) {
			setPinMode('set');
			pinSheet.open();
			return;
		}
		const ok = await requireAuth('Change PIN');
		if (!ok) return;
		setPinMode('change');
		pinSheet.open();
	}, [hasPin, requireAuth, pinSheet]);

	const handleRemovePin = useCallback(async () => {
		pinSheet.close();
		const ok = await confirm({
			title: 'Remove PIN?',
			description: 'This will also turn off Require PIN and biometrics.',
			confirmLabel: 'Remove',
			variant: 'danger',
		});
		if (!ok) return;
		clearPin().catch((err: unknown) => {
			log.error('security', 'Failed to clear PIN', err);
		});
	}, [pinSheet, confirm, clearPin]);

	const handleRequirePinToggle = useCallback(
		async (value: boolean) => {
			if (isRequirePin === value) return;
			const ok = await requireAuth(value ? 'Enable app lock' : 'Disable app lock');
			if (!ok) return;
			setRequirePin(value);
		},
		[isRequirePin, requireAuth, setRequirePin],
	);

	const handleBiometricsToggle = useCallback(
		async (value: boolean) => {
			if (isBiometricsEnabled === value) return;
			const ok = await requireAuth(value ? 'Enable biometrics' : 'Disable biometrics');
			if (!ok) return;
			setBiometricsEnabled(value);
		},
		[isBiometricsEnabled, requireAuth, setBiometricsEnabled],
	);

	const biometricsDescription = hasPin ? biometric.label : 'Set a PIN first';

	return (
		<Section label="Security">
			<ListGroup>
				<ListGroup.Item onPress={openPinFlow}>
					<ListGroup.ItemPrefix>
						<Asterisk size={20} color={muted} />
					</ListGroup.ItemPrefix>
					<ListGroup.ItemContent>
						<ListGroup.ItemTitle>PIN</ListGroup.ItemTitle>
						<ListGroup.ItemDescription>
							{hasPin ? 'Tap to change' : 'Not set'}
						</ListGroup.ItemDescription>
					</ListGroup.ItemContent>
					<ListGroup.ItemSuffix>
						<ChevronRight size={16} color={muted} />
					</ListGroup.ItemSuffix>
				</ListGroup.Item>
				<Separator className="mx-4" />
				<ControlField
					isDisabled={!hasPin}
					isSelected={isRequirePin}
					onSelectedChange={handleRequirePinToggle}
				>
					<ListGroup.Item>
						<ListGroup.ItemPrefix>
							<Lock size={20} color={muted} />
						</ListGroup.ItemPrefix>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Require PIN</ListGroup.ItemTitle>
						</ListGroup.ItemContent>
						<ListGroup.ItemSuffix>
							<ControlField.Indicator />
						</ListGroup.ItemSuffix>
					</ListGroup.Item>
				</ControlField>
				{biometric.isAvailable ? (
					<>
						<Separator className="mx-4" />
						<ControlField
							isDisabled={!hasPin}
							isSelected={isBiometricsEnabled}
							onSelectedChange={handleBiometricsToggle}
						>
							<ListGroup.Item>
								<ListGroup.ItemPrefix>
									<Fingerprint size={20} color={muted} />
								</ListGroup.ItemPrefix>
								<ListGroup.ItemContent>
									<ListGroup.ItemTitle>Unlock with Biometrics</ListGroup.ItemTitle>
									<ListGroup.ItemDescription>
										{biometricsDescription}
									</ListGroup.ItemDescription>
								</ListGroup.ItemContent>
								<ListGroup.ItemSuffix>
									<ControlField.Indicator />
								</ListGroup.ItemSuffix>
							</ListGroup.Item>
						</ControlField>
					</>
				) : null}
			</ListGroup>

			{pinSheet.isOpen ? (
				<PinSheet sheet={pinSheet} mode={pinMode} onRemove={handleRemovePin} />
			) : null}
		</Section>
	);
}
