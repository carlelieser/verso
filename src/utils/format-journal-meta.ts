export function formatJournalMeta(
	entryCount: number,
	isDefault: boolean,
	isPrivate = false,
): string {
	const parts: string[] = [];

	if (isPrivate) parts.push('Private');
	if (isDefault) parts.push('Default');

	if (!isPrivate) {
		parts.push(
			entryCount === 0
				? 'No entries'
				: `${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}`,
		);
	}

	return parts.join(' \u00B7 ');
}
