import { Button, Menu, Separator } from 'heroui-native';
import { ChevronDown, Lock, Plus } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Keyboard, Text, View } from 'react-native';

import { CreateJournal } from '@/components/journal/create-journal';
import { getJournalIcon } from '@/constants/journal-icons';
import { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { Journal } from '@/types/journal';

interface JournalSelectProps {
	readonly journals: readonly Journal[];
	readonly selectedId: string | null;
	readonly onSelect: (id: string) => void;
	readonly onCreateJournal: (name: string, icon: string, color: string) => Promise<void>;
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
	const TriggerIcon = getJournalIcon(selected?.icon ?? 'book-open');
	const createSheet = useBottomSheet();

	const handleCreate = useCallback(
		async (name: string, icon: string, color: string) => {
			await onCreateJournal(name, icon, color);
			createSheet.close();
		},
		[onCreateJournal, createSheet],
	);

	const handleOpenCreate = useCallback(() => {
		Keyboard.dismiss();
		createSheet.open();
	}, [createSheet]);

	return (
		<>
			<Menu presentation="popover">
				<Menu.Trigger asChild>
					<Button variant="ghost" size="sm">
						{selected ? (
							<View
								className="size-2 rounded-full mr-1"
								style={{ backgroundColor: selected.color }}
							/>
						) : null}
						<TriggerIcon size={16} color={muted} />
						<Button.Label className={'text-muted'}>{label}</Button.Label>
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
											{journal.isLocked ? (
												<View className="ml-auto">
													<Lock size={14} color={muted} />
												</View>
											) : null}
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

			{createSheet.isOpen ? (
				<CreateJournal sheet={createSheet} onCreate={handleCreate} />
			) : null}
		</>
	);
}
