import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Button } from 'heroui-native';
import React, { useRef, useState } from 'react';

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
	const nameRef = useRef(currentName);
	const [isValid, setIsValid] = useState(false);
	const { foreground, muted } = useThemeColors();

	return (
		<PortalSheet
			sheet={sheet}
			keyboardPersist
			footer={
				<Button
					variant="primary"
					isDisabled={!isValid}
					onPress={() => onRename(nameRef.current.trim())}
				>
					<Button.Label>Save</Button.Label>
				</Button>
			}
		>
			<BottomSheetTextInput
				defaultValue={currentName}
				onChangeText={(text) => {
					nameRef.current = text;
					const trimmed = text.trim();
					setIsValid(trimmed.length > 0 && trimmed !== currentName);
				}}
				placeholder="Journal name"
				placeholderTextColor={muted}
				autoFocus
				className="bg-surface rounded-xl px-4 py-3 text-base border border-border"
				style={{ color: foreground }}
			/>
		</PortalSheet>
	);
}
