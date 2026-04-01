export function padTime(value: number): string {
	return value.toString().padStart(2, '0');
}

export function formatTime12(hour: number, minute: number): { time: string; period: string } {
	const period = hour >= 12 ? 'PM' : 'AM';
	const h = hour % 12 || 12;
	return { time: `${h}:${padTime(minute)}`, period };
}

export function formatDurationMs(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${padTime(seconds)}`;
}
