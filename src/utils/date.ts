const ONE_DAY_MS = 86_400_000;

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function isToday(timestamp: number): boolean {
  const date = new Date(timestamp);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function getDateString(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDaysDifference(timestampA: number, timestampB: number): number {
  return Math.floor(Math.abs(timestampA - timestampB) / ONE_DAY_MS);
}

export function getStreakDays(entryDates: readonly string[]): number {
  if (entryDates.length === 0) return 0;

  const sorted = [...entryDates].sort().reverse();
  const today = getDateString(Date.now());

  if (sorted[0] !== today) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const current = new Date(sorted[i] ?? '');
    const previous = new Date(sorted[i - 1] ?? '');
    const diffDays = Math.round(
      (previous.getTime() - current.getTime()) / ONE_DAY_MS,
    );

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
