import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

import { AppDialog } from '@/components/ui/app-dialog';
import type { DialogState, DialogVariant } from '@/hooks/use-dialog';

interface ConfirmOptions {
	readonly title: string;
	readonly description: string;
	readonly confirmLabel?: string;
	readonly cancelLabel?: string;
	readonly variant?: DialogVariant;
}

interface AlertOptions {
	readonly title: string;
	readonly description: string;
	readonly dismissLabel?: string;
}

interface DialogContextValue {
	readonly alert: (options: AlertOptions) => Promise<void>;
	readonly confirm: (options: ConfirmOptions) => Promise<boolean>;
	readonly showError: (title: string, description: string) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useAppDialog(): DialogContextValue {
	const context = useContext(DialogContext);
	if (!context) {
		throw new Error('useAppDialog must be used within a DialogProvider');
	}
	return context;
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

interface DialogProviderProps {
	readonly children: React.ReactNode;
}

export function DialogProvider({ children }: DialogProviderProps): React.JSX.Element {
	const [state, setState] = useState<DialogState>(CLOSED_STATE);
	const resolveRef = useRef<((value: boolean) => void) | null>(null);

	const open = useCallback(
		(
			mode: 'alert' | 'confirm',
			options: {
				title: string;
				description: string;
				confirmLabel?: string;
				cancelLabel?: string;
				variant?: DialogVariant;
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

	return (
		<DialogContext.Provider value={{ alert, confirm, showError }}>
			{children}
			<AppDialog
				{...state}
				onConfirm={handleConfirm}
				onCancel={handleCancel}
			/>
		</DialogContext.Provider>
	);
}
