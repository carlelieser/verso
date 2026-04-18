export const ONE_DAY_MS = 86_400_000;

export function formatRelativeDate(timestamp: number): string {
	const date = new Date(timestamp);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / ONE_DAY_MS);

	if (diffDays === 0) return 'Today';
	if (diffDays === 1) return 'Yesterday';
	if (diffDays < 7) return `${diffDays} days ago`;

	const isSameYear = date.getFullYear() === now.getFullYear();
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		...(isSameYear ? {} : { year: 'numeric' }),
	});
}
