import { Button } from 'heroui-native';
import React, { useState } from 'react';

import { ColorPicker } from '@/components/ui/color-picker';
import { PortalSheet } from '@/components/ui/portal-sheet';
import type { useBottomSheet } from '@/hooks/use-bottom-sheet';

interface ChangeJournalColorProps {
	readonly sheet: ReturnType<typeof useBottomSheet>;
	readonly currentColor: string;
	readonly onChangeColor: (color: string) => void;
}

export function ChangeJournalColor({
	sheet,
	currentColor,
	onChangeColor,
}: ChangeJournalColorProps): React.JSX.Element {
	const [selectedColor, setSelectedColor] = useState(currentColor);

	const hasChanged = selectedColor !== currentColor;

	return (
		<PortalSheet
			sheet={sheet}
			footer={
				<Button
					variant="primary"
					isDisabled={!hasChanged}
					onPress={() => onChangeColor(selectedColor)}
				>
					<Button.Label>Save</Button.Label>
				</Button>
			}
		>
			<ColorPicker value={selectedColor} onChange={setSelectedColor} />
		</PortalSheet>
	);
}
