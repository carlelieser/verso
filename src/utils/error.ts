/** Extract a human-readable message from an unknown caught value. */
export function getErrorMessage(err: unknown, fallback?: string): string {
	if (err instanceof Error) return err.message;
	if (fallback !== undefined) return fallback;
	return String(err);
}
