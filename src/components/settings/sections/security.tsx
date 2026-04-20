import { ControlField, ListGroup, Separator } from 'heroui-native';
import { Asterisk, ChevronRight, Fingerprint, Lock } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';

import { Section } from '@/components/layout/section';
import { type PinSheetMode, PinSheet } from '@/components/security/pin-sheet';
import type { SecurityScope } from '@/components/security/security-scope';
import { useAppSecurityScope } from '@/components/security/use-app-security-scope';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { log } from '@/utils/log';

type ListGroupVariant = 'default' | 'secondary' | 'tertiary';

interface SecuritySectionProps {
	readonly scope?: SecurityScope;
	readonly variant?: ListGroupVariant;
}

export function SecuritySection({
	scope: providedScope,
	variant = 'default',
}: SecuritySectionProps): React.JSX.Element {
	if (providedScope) {
		return <SecuritySectionBody scope={providedScope} variant={variant} />;
	}
	return <AppSecuritySection variant={variant} />;
}

function AppSecuritySection({
	variant,
}: {
	readonly variant: ListGroupVariant;
}): React.JSX.Element {
	const scope = useAppSecurityScope();
	return <SecuritySectionBody scope={scope} variant={variant} />;
}

function SecuritySectionBody({
	scope: security,
	variant,
}: {
	readonly scope: SecurityScope;
	readonly variant: ListGroupVariant;
}): React.JSX.Element {
	const { muted } = useThemeColors();
	const {
		hasPin,
		canRequirePin,
		isRequirePin,
		isBiometricsEnabled,
		biometric,
		setPin,
		verifyPin,
		clearPin,
		setRequirePin,
		setBiometricsEnabled,
		requireAuth,
		confirmRemovePin,
		labels,
	} = security;

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
		const ok = await confirmRemovePin();
		if (!ok) return;
		Promise.resolve(clearPin()).catch((err: unknown) => {
			log.error('security', 'Failed to clear PIN', err);
		});
	}, [pinSheet, confirmRemovePin, clearPin]);

	const handleRequirePinToggle = useCallback(
		async (value: boolean) => {
			if (isRequirePin === value) return;
			const ok = await requireAuth(
				value ? labels.requirePinEnableReason : labels.requirePinDisableReason,
			);
			if (!ok) return;
			await setRequirePin(value);
		},
		[
			isRequirePin,
			requireAuth,
			setRequirePin,
			labels.requirePinEnableReason,
			labels.requirePinDisableReason,
		],
	);

	const handleBiometricsToggle = useCallback(
		async (value: boolean) => {
			if (isBiometricsEnabled === value) return;
			const ok = await requireAuth(
				value ? labels.biometricsEnableReason : labels.biometricsDisableReason,
			);
			if (!ok) return;
			await setBiometricsEnabled(value);
		},
		[
			isBiometricsEnabled,
			requireAuth,
			setBiometricsEnabled,
			labels.biometricsEnableReason,
			labels.biometricsDisableReason,
		],
	);

	const biometricsDescription = hasPin ? biometric.label : 'Set a PIN first';

	return (
		<Section label={labels.sectionTitle}>
			<ListGroup variant={variant}>
				<ListGroup.Item onPress={openPinFlow}>
					<ListGroup.ItemPrefix>
						<Asterisk size={20} color={muted} />
					</ListGroup.ItemPrefix>
					<ListGroup.ItemContent>
						<ListGroup.ItemTitle>PIN</ListGroup.ItemTitle>
						<ListGroup.ItemDescription>
							{hasPin ? labels.pinDescription : 'Not set'}
						</ListGroup.ItemDescription>
					</ListGroup.ItemContent>
					<ListGroup.ItemSuffix>
						<ChevronRight size={16} color={muted} />
					</ListGroup.ItemSuffix>
				</ListGroup.Item>
				<Separator className="mx-4" />
				<ControlField
					isDisabled={!canRequirePin}
					isSelected={isRequirePin}
					onSelectedChange={handleRequirePinToggle}
				>
					<ListGroup.Item>
						<ListGroup.ItemPrefix>
							<Lock size={20} color={muted} />
						</ListGroup.ItemPrefix>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>{labels.requirePinLabel}</ListGroup.ItemTitle>
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
							isDisabled={!canRequirePin || !isRequirePin}
							isSelected={isBiometricsEnabled}
							onSelectedChange={handleBiometricsToggle}
						>
							<ListGroup.Item>
								<ListGroup.ItemPrefix>
									<Fingerprint size={20} color={muted} />
								</ListGroup.ItemPrefix>
								<ListGroup.ItemContent>
									<ListGroup.ItemTitle>
										Unlock with Biometrics
									</ListGroup.ItemTitle>
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
				<PinSheet
					sheet={pinSheet}
					mode={pinMode}
					onRemove={handleRemovePin}
					onVerify={verifyPin}
					onSave={setPin}
				/>
			) : null}
		</Section>
	);
}
