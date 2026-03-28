import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Button, Menu, Separator } from 'heroui-native';
import { BookOpen, ChevronDown, Plus } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Keyboard, Text, View } from 'react-native';

import { CreateJournal } from '@/components/create-journal';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { Journal } from '@/types/journal';

interface JournalSelectProps {
	readonly journals: readonly Journal[];
	readonly selectedId: string | null;
	readonly onSelect: (id: string) => void;
	readonly onCreateJournal: (name: string, icon: string) => Promise<void>;
}

export function JournalSelect({
	journals,
	selectedId,
	onSelect,
	onCreateJournal,
}: JournalSelectProps): React.JSX.Element {
	const { accent, muted } = useThemeColors();
	const selected = journals.find((j) => j.id === selectedId);
	const label = selected?.name ?? 'Select journal';
	const sheet = useBottomSheet();

	const handleCreate = useCallback(
		async (name: string, icon: string) => {
			await onCreateJournal(name, icon);
			sheet.close();
		},
		[onCreateJournal, sheet],
	);

	const handleOpenCreate = useCallback(() => {
		Keyboard.dismiss();
		sheet.open();
	}, [sheet]);

	return (
		<>
			<Menu presentation="popover">
				<Menu.Trigger asChild>
					<Button variant="ghost" size="sm">
						<BookOpen size={16} color={muted} />
						<Button.Label className={"text-muted"}>{label}</Button.Label>
						<ChevronDown size={14} color={muted} />
					</Button>
				</Menu.Trigger>
				<Menu.Portal>
					<Menu.Overlay />
					<Menu.Content presentation="popover" width={250}>
						{journals.length > 0 ? (
							<Menu.Group
								selectionMode="single"
								selectedKeys={selectedId ? new Set([selectedId]) : new Set()}
								onSelectionChange={(keys) => {
									const id = [...keys][0];
									if (typeof id === 'string') {
										onSelect(id);
									}
								}}
							>
								<Menu.Label>Journals</Menu.Label>
								{journals.map((journal) => {
									return (
										<Menu.Item key={journal.id} id={journal.id}>
											<Menu.ItemIndicator variant="dot" />
											<Menu.ItemTitle>{journal.name}</Menu.ItemTitle>
										</Menu.Item>
									);
								})}
							</Menu.Group>
						) : (
							<View className="px-3 py-4 items-center">
								<Text className="text-sm text-muted">No journals yet</Text>
							</View>
						)}
						<Separator className="mx-2 my-2 opacity-75" />
						<Menu.Item id="__create__" shouldCloseOnSelect onPress={handleOpenCreate}>
							<Plus size={16} color={accent} />
							<Menu.ItemTitle style={{ color: accent }}>New Journal</Menu.ItemTitle>
						</Menu.Item>
					</Menu.Content>
				</Menu.Portal>
			</Menu>

			{sheet.isOpen ? (
				<BottomSheet ref={sheet.ref} {...sheet.sheetProps}>
					<BottomSheetScrollView keyboardShouldPersistTaps="handled">
						<CreateJournal onCreate={handleCreate} />
					</BottomSheetScrollView>
				</BottomSheet>
			) : null}
		</>
	);
}
