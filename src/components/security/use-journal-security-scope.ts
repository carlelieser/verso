import { useCallback, useMemo } from 'react';

import type { SecurityScope } from '@/components/security/security-scope';
import { useJournals } from '@/hooks/use-journals';
import { useSecurity } from '@/hooks/use-security';
import { useDatabaseContext } from '@/providers/database-provider';
import { useConfirmDialog } from '@/providers/dialog-provider';
import { useReauth } from '@/providers/reauth-provider';
import {
	clearJournalOverridePin,
	setJournalBiometrics,
	setJournalLocked,
	setJournalOverridePin,
	verifyJournalPin,
} from '@/services/journal-service';

const JOURNAL_LABELS = {
	sectionTitle: '',
	pinDescription: 'Tap to change',
	requirePinLabel: 'Lock',
	pinRemoveConfirmDescription:
		'This journal will fall back to the app PIN and biometrics will be turned off.',
	requirePinEnableReason: 'Lock journal',
	requirePinDisableReason: 'Unlock journal',
	biometricsEnableReason: 'Enable biometrics',
	biometricsDisableReason: 'Disable biometrics',
} as const;

export function useJournalSecurityScope(journalId: string): SecurityScope {
	const { db } = useDatabaseContext();
	const { hasPin: appHasPin, biometric } = useSecurity();
	const { journals } = useJournals();
	const { requireAuth: baseRequireAuth } = useReauth();
	const { confirm } = useConfirmDialog();

	const journal = journals.find((j) => j.id === journalId);
	const hasPin = journal?.hasOverridePin ?? false;
	const isRequirePin = journal?.isLocked ?? false;
	const isBiometricsEnabled = journal?.biometricsEnabled ?? false;

	const setPin = useCallback(
		async (pin: string): Promise<void> => {
			await setJournalOverridePin(db, journalId, pin);
		},
		[db, journalId],
	);

	const verifyPin = useCallback(
		async (pin: string): Promise<boolean> => {
			return verifyJournalPin(db, journalId, pin);
		},
		[db, journalId],
	);

	const requireAuth = useCallback(
		(reason: string): Promise<boolean> =>
			baseRequireAuth(reason, {
				hasPin: hasPin || appHasPin,
				isBiometricsEnabled,
				verifyPin,
			}),
		[baseRequireAuth, hasPin, appHasPin, isBiometricsEnabled, verifyPin],
	);

	const clearPin = useCallback(async (): Promise<void> => {
		await clearJournalOverridePin(db, journalId);
	}, [db, journalId]);

	const setRequirePin = useCallback(
		async (value: boolean): Promise<void> => {
			await setJournalLocked(db, journalId, value);
		},
		[db, journalId],
	);

	const setBiometricsEnabled = useCallback(
		async (value: boolean): Promise<void> => {
			await setJournalBiometrics(db, journalId, value);
		},
		[db, journalId],
	);

	const confirmRemovePin = useCallback(
		() =>
			confirm({
				title: 'Remove PIN?',
				description: JOURNAL_LABELS.pinRemoveConfirmDescription,
				confirmLabel: 'Remove',
				variant: 'danger',
			}),
		[confirm],
	);

	return useMemo<SecurityScope>(
		() => ({
			hasPin,
			canRequirePin: hasPin || appHasPin,
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
			labels: JOURNAL_LABELS,
		}),
		[
			hasPin,
			appHasPin,
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
		],
	);
}
