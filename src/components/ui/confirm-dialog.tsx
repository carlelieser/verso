import { Button, type ButtonVariant, Dialog } from 'heroui-native';
import React from 'react';
import { View } from 'react-native';

import type { DialogState, DialogVariant } from '@/hooks/use-dialog';

interface ConfirmDialogProps extends DialogState {
	readonly onConfirm: () => void;
	readonly onCancel: () => void;
}

const CONFIRM_BUTTON_VARIANTS: Record<DialogVariant, ButtonVariant> = {
	default: 'primary',
	danger: 'danger',
};

export function ConfirmDialog({
	isOpen,
	mode,
	title,
	description,
	confirmLabel,
	cancelLabel,
	variant,
	onConfirm,
	onCancel,
}: ConfirmDialogProps): React.JSX.Element {
	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={(open) => {
				if (!open) onCancel();
			}}
		>
			<Dialog.Portal>
				<Dialog.Overlay className={'bg-background/50'} />
				<Dialog.Content>
					<View className="mb-5 gap-1">
						<Dialog.Title>{title}</Dialog.Title>
						<Dialog.Description>{description}</Dialog.Description>
					</View>
					<View className="flex-row justify-end gap-3">
						{mode === 'confirm' ? (
							<Button variant="ghost" size="sm" onPress={onCancel}>
								{cancelLabel}
							</Button>
						) : null}
						<Button
							variant={CONFIRM_BUTTON_VARIANTS[variant]}
							size="sm"
							onPress={onConfirm}
						>
							{confirmLabel}
						</Button>
					</View>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog>
	);
}
