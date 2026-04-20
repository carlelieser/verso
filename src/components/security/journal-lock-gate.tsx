import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BiometricIcon } from '@/components/security/biometric-icon';
import { PinDots } from '@/components/security/pin-dots';
import { PinPad } from '@/components/security/pin-pad';
import { PIN_MAX_LENGTH, PIN_MIN_LENGTH } from '@/constants/settings';
import { useJournals } from '@/hooks/use-journals';
import { useSecurity } from '@/hooks/use-security';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useDatabaseContext } from '@/providers/database-provider';
import { useJournalLock } from '@/providers/journal-lock-provider';
import { authenticateBiometric } from '@/services/biometric-service';
import { verifyJournalPin } from '@/services/journal-service';
import { getErrorMessage } from '@/utils/error';
import { log } from '@/utils/log';

interface JournalLockGateProps {
	readonly journalId: string;
	readonly children: React.ReactNode;
}

export function JournalLockGate({
	journalId,
	children,
}: JournalLockGateProps): React.JSX.Element | null {
	const { db } = useDatabaseContext();
	const { journals } = useJournals();
	const { biometric } = useSecurity();
	const { isJournalUnlocked, unlockJournal, lockJournal } = useJournalLock();
	const { muted } = useThemeColors();
	const insets = useSafeAreaInsets();

	const journal = journals.find((j) => j.id === journalId);
	const isUnlocked = isJournalUnlocked(journalId);
	const isLocked = journal?.isLocked ?? false;
	const willTryBiometric = (journal?.biometricsEnabled ?? false) && biometric.isAvailable;

	const [value, setValue] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isBiometricPending, setIsBiometricPending] = useState(willTryBiometric);
	const biometricAttemptedRef = useRef(false);

	const shouldShow = isLocked && !isUnlocked;

	useEffect(() => {
		return () => {
			lockJournal(journalId);
		};
	}, [journalId, lockJournal]);

	useEffect(() => {
		if (!shouldShow) {
			biometricAttemptedRef.current = false;
			setValue('');
			setError(null);
			setIsBiometricPending(willTryBiometric);
			return;
		}
		if (biometricAttemptedRef.current) return;
		biometricAttemptedRef.current = true;
		if (!willTryBiometric) {
			setIsBiometricPending(false);
			return;
		}
		authenticateBiometric(`Unlock ${journal?.name ?? 'journal'}`)
			.then((ok) => {
				if (ok) unlockJournal(journalId);
				else setIsBiometricPending(false);
			})
			.catch((err: unknown) => {
				log.warn('journal-lock-gate', 'Biometric unlock failed', err);
				setIsBiometricPending(false);
			});
	}, [shouldShow, willTryBiometric, journalId, journal?.name, unlockJournal]);

	const handleDigit = useCallback((digit: string) => {
		setError(null);
		setValue((prev) => (prev.length >= PIN_MAX_LENGTH ? prev : prev + digit));
	}, []);

	const handleDelete = useCallback(() => {
		setError(null);
		setValue((prev) => prev.slice(0, -1));
	}, []);

	const tryBiometric = useCallback(() => {
		Haptics.selectionAsync();
		authenticateBiometric(`Unlock ${journal?.name ?? 'journal'}`)
			.then((ok) => {
				if (ok) unlockJournal(journalId);
			})
			.catch((err: unknown) => {
				log.warn('journal-lock-gate', 'Biometric unlock failed', err);
			});
	}, [journal?.name, journalId, unlockJournal]);

	const handleSubmit = useCallback(async () => {
		if (value.length < PIN_MIN_LENGTH) return;
		setIsSubmitting(true);
		try {
			const ok = await verifyJournalPin(db, journalId, value);
			if (ok) {
				unlockJournal(journalId);
				return;
			}
			setError('Wrong PIN. Try again.');
			setValue('');
		} catch (err: unknown) {
			setError(getErrorMessage(err, 'Something went wrong.'));
		} finally {
			setIsSubmitting(false);
		}
	}, [db, journalId, value, unlockJournal]);

	if (!journal) return null;
	if (!shouldShow) return <>{children}</>;

	const canSubmit = value.length >= PIN_MIN_LENGTH && !isSubmitting;

	return (
		<Animated.View
			entering={FadeIn.duration(150)}
			exiting={SlideOutDown.duration(300)}
			className="absolute inset-0 bg-background items-center justify-center gap-12 z-50"
			style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
		>
			{isBiometricPending ? null : (
				<Animated.View
					entering={FadeIn.duration(150)}
					exiting={FadeOut.duration(150)}
					className="items-center gap-12"
				>
					<View className="h-12 items-center justify-center gap-4">
						<Text className="text-lg text-foreground font-medium">
							Unlock {journal.name}
						</Text>
						<Text className="text-sm text-muted text-center">
							{error ?? 'Enter PIN'}
						</Text>
					</View>
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
					{willTryBiometric ? (
						<Pressable
							onPress={tryBiometric}
							className="flex-row items-center gap-2 px-4 py-3 active:opacity-60"
						>
							<BiometricIcon type={biometric.type} color={muted} />
							<Text className="text-base text-muted">Use {biometric.label}</Text>
						</Pressable>
					) : null}
				</Animated.View>
			)}
		</Animated.View>
	);
}
