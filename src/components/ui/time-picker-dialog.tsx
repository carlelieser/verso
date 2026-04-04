import { Dialog } from 'heroui-native';
import React from 'react';

import { TimePicker } from '@/components/ui/time-picker';

interface TimePickerDialogProps {
	readonly isOpen: boolean;
	readonly initialHour?: number;
	readonly initialMinute?: number;
	readonly onConfirm: (hour: number, minute: number) => void;
	readonly onClose: () => void;
}

export function TimePickerDialog({
	isOpen,
	initialHour,
	initialMinute,
	onConfirm,
	onClose,
}: TimePickerDialogProps): React.JSX.Element {
	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<Dialog.Portal>
				<Dialog.Overlay className="bg-background/50" />
				<Dialog.Content className={'pt-8'} isSwipeable={false}>
					{isOpen ? (
						<TimePicker
							initialHour={initialHour}
							initialMinute={initialMinute}
							onConfirm={(hour, minute) => {
								onConfirm(hour, minute);
								onClose();
							}}
							onCancel={onClose}
						/>
					) : null}
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog>
	);
}
