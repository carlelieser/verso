export function formatJournalMeta(entryCount: number, isDefault: boolean): string {
	const parts: string[] = [];

	if (isDefault) parts.push('Default');

	parts.push(
		entryCount === 0
			? 'No entries'
			: `${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}`,
	);

	return parts.join(' \u00B7 ');
}
