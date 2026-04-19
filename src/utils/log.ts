import { getErrorMessage } from '@/utils/error';

function format(scope: string, message: string): string {
	return `[${scope}] ${message}`;
}

export const log = {
	warn(scope: string, message: string, err?: unknown): void {
		if (!__DEV__) return;
		const formatted = format(scope, message);
		if (err === undefined) {
			console.warn(formatted);
			return;
		}
		console.warn(formatted, getErrorMessage(err));
	},

	error(scope: string, message: string, err?: unknown): void {
		const formatted = format(scope, message);
		if (err === undefined) {
			console.error(formatted);
			return;
		}
		console.error(formatted, getErrorMessage(err));
	},
};
