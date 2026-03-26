import { useCallback, useRef, useState } from 'react';

export type DialogVariant = 'default' | 'danger';
type DialogMode = 'alert' | 'confirm';

interface DialogOptions {
	readonly title: string;
	readonly description: string;
	readonly variant?: DialogVariant;
}

interface ConfirmOptions extends DialogOptions {
	readonly confirmLabel?: string;
	readonly cancelLabel?: string;
}

interface AlertOptions extends DialogOptions {
	readonly dismissLabel?: string;
}

export interface DialogState {
	readonly isOpen: boolean;
	readonly mode: DialogMode;
	readonly title: string;
	readonly description: string;
	readonly variant: DialogVariant;
	readonly confirmLabel: string;
	readonly cancelLabel: string;
}

interface UseDialogResult {
	readonly state: DialogState;
	readonly alert: (options: AlertOptions) => Promise<void>;
	readonly confirm: (options: ConfirmOptions) => Promise<boolean>;
	/** Shorthand for alert({ title, description }) — matches onError callback signatures. */
	readonly showError: (title: string, description: string) => void;
	readonly handleConfirm: () => void;
	readonly handleCancel: () => void;
}

const CLOSED_STATE: DialogState = {
	isOpen: false,
	mode: 'alert',
	title: '',
	description: '',
	variant: 'default',
	confirmLabel: 'OK',
	cancelLabel: 'Cancel',
};

export function useDialog(): UseDialogResult {
	const [state, setState] = useState<DialogState>(CLOSED_STATE);
	const resolveRef = useRef<((value: boolean) => void) | null>(null);

	const open = useCallback(
		(
			mode: DialogMode,
			options: DialogOptions & {
				confirmLabel?: string;
				cancelLabel?: string;
			},
		): Promise<boolean> => {
			return new Promise<boolean>((resolve) => {
				resolveRef.current = resolve;
				setState({
					isOpen: true,
					mode,
					title: options.title,
					description: options.description,
					variant: options.variant ?? 'default',
					confirmLabel: options.confirmLabel ?? 'OK',
					cancelLabel: options.cancelLabel ?? 'Cancel',
				});
			});
		},
		[],
	);

	const alert = useCallback(
		async (options: AlertOptions): Promise<void> => {
			await open('alert', { ...options, confirmLabel: options.dismissLabel });
		},
		[open],
	);

	const confirm = useCallback(
		(options: ConfirmOptions): Promise<boolean> => {
			return open('confirm', options);
		},
		[open],
	);

	const showError = useCallback(
		(title: string, description: string): void => {
			open('alert', { title, description });
		},
		[open],
	);

	const handleConfirm = useCallback(() => {
		resolveRef.current?.(true);
		resolveRef.current = null;
		setState(CLOSED_STATE);
	}, []);

	const handleCancel = useCallback(() => {
		resolveRef.current?.(false);
		resolveRef.current = null;
		setState(CLOSED_STATE);
	}, []);

	return { state, alert, confirm, showError, handleConfirm, handleCancel };
}
