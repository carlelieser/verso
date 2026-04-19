import { Button } from 'heroui-native';
import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';


import { PinDots } from '@/components/security/pin-dots';
import { PinPad } from '@/components/security/pin-pad';
import { PortalSheet } from '@/components/ui/portal-sheet';
import { PIN_MAX_LENGTH, PIN_MIN_LENGTH } from '@/constants/settings';
import type { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useSecurity } from '@/hooks/use-security';
import { verifyPin } from '@/services/pin-service';
import { getErrorMessage } from '@/utils/error';

export type PinSheetMode = 'set' | 'change' | 'verify';

type Step = 'current' | 'new' | 'confirm';

interface PinSheetProps {
	readonly sheet: ReturnType<typeof useBottomSheet>;
	readonly mode: PinSheetMode;
	readonly onSuccess?: () => void;
	readonly onRemove?: () => void;
}

const STEP_DESCRIPTION: Record<Step, string> = {
	current: 'Enter your current PIN to continue.',
	new: `Choose a PIN with at least ${PIN_MIN_LENGTH} digits.`,
	confirm: 'Re-enter your new PIN to confirm.',
};

export function PinSheet({ sheet, mode, onSuccess, onRemove }: PinSheetProps): React.JSX.Element {
	const { setPin } = useSecurity();
	const [step, setStep] = useState<Step>(() =>
		mode === 'change' ? 'current' : mode === 'verify' ? 'current' : 'new',
	);
	const [value, setValue] = useState('');
	const [candidate, setCandidate] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const reset = useCallback(() => {
		setValue('');
		setError(null);
	}, []);

	const handleDigit = useCallback((digit: string) => {
		setError(null);
		setValue((prev) => (prev.length >= PIN_MAX_LENGTH ? prev : prev + digit));
	}, []);

	const handleDelete = useCallback(() => {
		setError(null);
		setValue((prev) => prev.slice(0, -1));
	}, []);

	const handleSubmit = useCallback(async () => {
		if (value.length < PIN_MIN_LENGTH) {
			setError(`PIN must be at least ${PIN_MIN_LENGTH} digits.`);
			return;
		}
		setIsSubmitting(true);
		try {
			if (step === 'current') {
				const ok = await verifyPin(value);
				if (!ok) {
					setError('Wrong PIN. Try again.');
					setValue('');
					return;
				}
				if (mode === 'verify') {
					onSuccess?.();
					sheet.close();
					return;
				}
				setStep('new');
				reset();
				return;
			}
			if (step === 'new') {
				setCandidate(value);
				setStep('confirm');
				reset();
				return;
			}
			// confirm
			if (value !== candidate) {
				setError('PINs do not match.');
				setValue('');
				return;
			}
			await setPin(value);
			onSuccess?.();
			sheet.close();
		} catch (err: unknown) {
			setError(getErrorMessage(err, 'Something went wrong.'));
		} finally {
			setIsSubmitting(false);
		}
	}, [value, step, mode, candidate, setPin, onSuccess, sheet, reset]);

	const canSubmit = value.length >= PIN_MIN_LENGTH && !isSubmitting;

	const showRemove = mode === 'change' && step === 'current' && onRemove !== undefined;

	return (
		<PortalSheet
			sheet={sheet}
			title={<View></View>}
			keyboardPersist
		>
			<Text className="text-base text-muted text-center">{STEP_DESCRIPTION[step]}</Text>

			{error !== null ? (
				<Text className="text-sm text-muted text-center">{error}</Text>
			) : null}

			<View className="py-12">
				<PinDots length={value.length} maxLength={PIN_MAX_LENGTH} />
			</View>

			<PinPad
				onDigit={handleDigit}
				onDelete={handleDelete}
				onSubmit={handleSubmit}
				canSubmit={canSubmit}
				isDisabled={isSubmitting}
			/>

			{showRemove ? (
				<Button variant="ghost" onPress={onRemove}>
					<Button.Label>Remove PIN</Button.Label>
				</Button>
			) : null}
		</PortalSheet>
	);
}
