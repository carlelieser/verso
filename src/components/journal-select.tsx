import {ArrowUpRight, BookOpen, ChevronDown, Plus} from 'lucide-react-native';
import React from 'react';
import {Text, View} from 'react-native';
import {useCSSVariable} from 'uniwind';

import {Button, Menu, Separator} from 'heroui-native';

import type {Journal} from '@/types/journal';
import {getJournalIcon} from '@/constants/journal-icons';

const MAX_VISIBLE = 3;

interface JournalSelectProps {
	readonly journals: readonly Journal[];
	readonly selectedId: string | null;
	readonly onSelect: (id: string) => void;
	readonly onCreate: () => void;
	readonly onViewAll?: () => void;
}

export function JournalSelect({
								  journals,
								  selectedId,
								  onSelect,
								  onCreate,
								  onViewAll
							  }: JournalSelectProps): React.JSX.Element {
	const [accent, muted] = useCSSVariable(['--color-accent', '--color-muted']);
	const selected = journals.find((j) => j.id === selectedId);
	const label = selected?.name ?? 'Select journal';
	const visibleJournals = journals.slice(0, MAX_VISIBLE);

	return (
		<Menu presentation={"bottom-sheet"}>
			<Menu.Trigger asChild>
				<Button variant={"ghost"} size="sm">
					<BookOpen size={16} color={muted as string}/>
					<Button.Label>{label}</Button.Label>
					<ChevronDown size={14} color={muted as string}/>
				</Button>
			</Menu.Trigger>
			<Menu.Portal>
				<Menu.Overlay className="bg-black/50"/>
				<Menu.Content presentation="bottom-sheet">
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
							{visibleJournals.map((journal) => {
								const JournalIcon = getJournalIcon(journal.icon);
								return (
									<Menu.Item key={journal.id} id={journal.id}>
										<Menu.ItemIndicator variant="dot"/>
										<JournalIcon size={16} color={muted as string}/>
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
					<Separator className="mx-2 my-2 opacity-75"/>
					<Menu.Item
						id="__view_all__"
						shouldCloseOnSelect
						onSelectedChange={() => onViewAll?.()}
					>
						<ArrowUpRight size={16} color={muted as string}/>
						<Menu.ItemTitle>
							<Text>View all</Text>
						</Menu.ItemTitle>
					</Menu.Item>
					<Menu.Item
						id="__create__"
						shouldCloseOnSelect
						onSelectedChange={() => onCreate()}
					>
						<Plus size={16} color={accent as string}/>
						<Menu.ItemTitle>
							<Text style={{color: accent as string}}>New Journal</Text>
						</Menu.ItemTitle>
					</Menu.Item>
				</Menu.Content>
			</Menu.Portal>
		</Menu>
	);
}
