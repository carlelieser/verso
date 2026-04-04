import { Button } from 'heroui-native';
import React, { useState } from 'react';

import { IconPicker } from '@/components/ui/icon-picker';
import { PortalSheet } from '@/components/ui/portal-sheet';
import { JOURNAL_ICONS } from '@/constants/journal-icons';
import type { useBottomSheet } from '@/hooks/use-bottom-sheet';

interface ChangeJournalIconProps {
	readonly sheet: ReturnType<typeof useBottomSheet>;
	readonly currentIcon: string;
	readonly onChangeIcon: (icon: string) => void;
}

export function ChangeJournalIcon({
	sheet,
	currentIcon,
	onChangeIcon,
}: ChangeJournalIconProps): React.JSX.Element {
	const [selectedIcon, setSelectedIcon] = useState(currentIcon);

	const hasChanged = selectedIcon !== currentIcon;

	return (
		<PortalSheet
			sheet={sheet}
			footer={
				<Button
					variant="primary"
					isDisabled={!hasChanged}
					onPress={() => onChangeIcon(selectedIcon)}
				>
					<Button.Label>Save</Button.Label>
				</Button>
			}
		>
			<IconPicker
				icons={JOURNAL_ICONS}
				selectedKey={selectedIcon}
				onSelect={setSelectedIcon}
			/>
		</PortalSheet>
	);
}
