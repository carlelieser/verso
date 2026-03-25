const UNITS = ['B', 'KB', 'MB', 'GB'] as const;
const DIVISOR = 1024;

export function formatFileSize(bytes: number | null): string {
	if (bytes === null || bytes < 0) return 'Unknown size';
	if (bytes === 0) return '0 B';

	let value = bytes;
	let unitIndex = 0;

	while (value >= DIVISOR && unitIndex < UNITS.length - 1) {
		value /= DIVISOR;
		unitIndex++;
	}

	const formatted = unitIndex === 0 ? String(value) : value.toFixed(1);
	return `${formatted} ${UNITS[unitIndex]}`;
}
