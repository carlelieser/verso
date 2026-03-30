import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Button } from 'heroui-native';
import React, { useState } from 'react';

import { PortalSheet } from '@/components/ui/portal-sheet';
import type { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface RenameJournalProps {
	readonly sheet: ReturnType<typeof useBottomSheet>;
	readonly currentName: string;
	readonly onRename: (name: string) => void;
}

export function RenameJournal({
	sheet,
	currentName,
	onRename,
}: RenameJournalProps): React.JSX.Element {
	const [name, setName] = useState(currentName);
	const { foreground, muted } = useThemeColors();

	const isValid = name.trim().length > 0 && name.trim() !== currentName;

	return (
		<PortalSheet
			sheet={sheet}
			title="Rename Journal"
			keyboardPersist
			footer={
				<Button
					variant="primary"
					isDisabled={!isValid}
					onPress={() => onRename(name.trim())}
				>
					<Button.Label>Save</Button.Label>
				</Button>
			}
		>
			<BottomSheetTextInput
				value={name}
				onChangeText={setName}
				placeholder="Journal name"
				placeholderTextColor={muted}
				autoFocus
				className="bg-surface rounded-xl px-4 py-3 text-base border border-border"
				style={{ color: foreground }}
			/>
		</PortalSheet>
	);
}
