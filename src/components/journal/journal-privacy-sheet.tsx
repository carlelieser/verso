import React from 'react';

import { useJournalSecurityScope } from '@/components/security/use-journal-security-scope';
import { SecuritySection } from '@/components/settings/sections/security';
import { PortalSheet } from '@/components/ui/portal-sheet';
import type { useBottomSheet } from '@/hooks/use-bottom-sheet';

interface JournalPrivacySheetProps {
	readonly sheet: ReturnType<typeof useBottomSheet>;
	readonly journalId: string;
}

export function JournalPrivacySheet({
	sheet,
	journalId,
}: JournalPrivacySheetProps): React.JSX.Element {
	const scope = useJournalSecurityScope(journalId);

	return (
		<PortalSheet sheet={sheet}>
			<SecuritySection scope={scope} variant="secondary" />
		</PortalSheet>
	);
}
