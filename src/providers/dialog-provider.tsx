import React, { createContext, useContext } from 'react';

import { AppDialog } from '@/components/ui/app-dialog';
import { useDialog } from '@/hooks/use-dialog';

interface DialogContextValue {
	readonly alert: ReturnType<typeof useDialog>['alert'];
	readonly confirm: ReturnType<typeof useDialog>['confirm'];
	readonly showError: ReturnType<typeof useDialog>['showError'];
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useAppDialog(): DialogContextValue {
	const context = useContext(DialogContext);
	if (!context) {
		throw new Error('useAppDialog must be used within a DialogProvider');
	}
	return context;
}

interface DialogProviderProps {
	readonly children: React.ReactNode;
}

export function DialogProvider({ children }: DialogProviderProps): React.JSX.Element {
	const dialog = useDialog();

	return (
		<DialogContext.Provider value={{ alert: dialog.alert, confirm: dialog.confirm, showError: dialog.showError }}>
			{children}
			<AppDialog
				{...dialog.state}
				onConfirm={dialog.handleConfirm}
				onCancel={dialog.handleCancel}
			/>
		</DialogContext.Provider>
	);
}
