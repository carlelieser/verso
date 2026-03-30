import React, { createContext, useContext, useMemo } from 'react';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useDialog } from '@/hooks/use-dialog';

interface DialogContextValue {
	readonly alert: ReturnType<typeof useDialog>['alert'];
	readonly confirm: ReturnType<typeof useDialog>['confirm'];
	readonly showError: ReturnType<typeof useDialog>['showError'];
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useConfirmDialog(): DialogContextValue {
	const context = useContext(DialogContext);
	if (!context) {
		throw new Error('useConfirmDialog must be used within a DialogProvider');
	}
	return context;
}

interface DialogProviderProps {
	readonly children: React.ReactNode;
}

export function DialogProvider({ children }: DialogProviderProps): React.JSX.Element {
	const dialog = useDialog();

	const contextValue = useMemo(
		() => ({ alert: dialog.alert, confirm: dialog.confirm, showError: dialog.showError }),
		[dialog.alert, dialog.confirm, dialog.showError],
	);

	return (
		<DialogContext.Provider value={contextValue}>
			{children}
			<ConfirmDialog
				{...dialog.state}
				onConfirm={dialog.handleConfirm}
				onCancel={dialog.handleCancel}
			/>
		</DialogContext.Provider>
	);
}
