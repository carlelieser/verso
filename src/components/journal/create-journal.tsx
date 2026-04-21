import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Button } from 'heroui-native';
import React, { useRef, useState } from 'react';

import { Section } from '@/components/layout/section';
import { ColorPicker, getRandomSwatch } from '@/components/ui/color-picker';
import { IconPicker } from '@/components/ui/icon-picker';
import { PortalSheet } from '@/components/ui/portal-sheet';
import { JOURNAL_ICONS } from '@/constants/journal-icons';
import type { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface CreateJournalProps {
	readonly sheet: ReturnType<typeof useBottomSheet>;
	readonly onCreate: (name: string, icon: string, color: string) => void;
}

export function CreateJournal({ sheet, onCreate }: CreateJournalProps): React.JSX.Element {
	const nameRef = useRef('');
	const [isValid, setIsValid] = useState(false);
	const [selectedIcon, setSelectedIcon] = useState('book-open');
	const [selectedColor, setSelectedColor] = useState(getRandomSwatch);
	const { foreground, muted } = useThemeColors();

	return (
		<PortalSheet
			sheet={sheet}
			keyboardPersist
			footer={
				<Button
					variant="primary"
					isDisabled={!isValid}
					onPress={() => onCreate(nameRef.current.trim(), selectedIcon, selectedColor)}
				>
					<Button.Label>Create Journal</Button.Label>
				</Button>
			}
		>
			<Section label="Name">
				<BottomSheetTextInput
					defaultValue=""
					onChangeText={(text) => {
						nameRef.current = text;
						setIsValid(text.trim().length > 0);
					}}
					placeholder="e.g. Daily, Work, Ideas..."
					placeholderTextColor={muted}
					autoFocus={true}
					className="bg-surface rounded-xl px-4 py-3 text-base border border-border"
					style={{ color: foreground }}
				/>
			</Section>

			<Section label="Icon">
				<IconPicker
					icons={JOURNAL_ICONS}
					selectedKey={selectedIcon}
					onSelect={setSelectedIcon}
				/>
			</Section>

			<Section label="Color">
				<ColorPicker value={selectedColor} onChange={setSelectedColor} />
			</Section>
		</PortalSheet>
	);
}
