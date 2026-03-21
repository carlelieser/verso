import {ChevronLeft, Search} from 'lucide-react-native';
import {router, useLocalSearchParams} from 'expo-router';
import React, {useCallback, useState} from 'react';
import {FlatList, Pressable, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useCSSVariable} from 'uniwind';

import {Button, Card} from 'heroui-native';

import {getJournalIcon} from '@/constants/journal-icons';
import {useEntries} from '@/hooks/use-entries';
import {useJournals} from '@/hooks/use-journals';
import type {EntryWithJournal} from '@/services/entry-service';
import {formatRelativeDate} from '@/utils/date';

function EntryCard({
	entry,
	onPress,
}: {
	readonly entry: EntryWithJournal;
	readonly onPress: () => void;
}): React.JSX.Element {
	const preview = entry.contentText.slice(0, 120).trim();

	return (
		<Pressable onPress={onPress}>
			<Card>
				<Card.Body>
					<View>
						<Card.Description className="font-editor text-sm" numberOfLines={2}>
							{preview || 'Empty entry'}
						</Card.Description>
						<View className="flex-row items-center justify-end mt-1">
							<Card.Description className="text-xs opacity-50">
								{formatRelativeDate(entry.createdAt)}
							</Card.Description>
						</View>
					</View>
				</Card.Body>
			</Card>
		</Pressable>
	);
}

export default function JournalDetailScreen(): React.JSX.Element {
	const {id} = useLocalSearchParams<{ id: string }>();
	const insets = useSafeAreaInsets();
	const [muted, surface, foreground, border] = useCSSVariable([
		'--color-muted',
		'--color-surface',
		'--color-foreground',
		'--color-border',
	]);

	const {journals} = useJournals();
	const journal = journals.find((j) => j.id === id);
	const {entries, searchEntries} = useEntries(id);
	const [searchQuery, setSearchQuery] = useState('');

	const handleSearch = useCallback(
		async (query: string) => {
			setSearchQuery(query);
			await searchEntries(query);
		},
		[searchEntries],
	);

	const Icon = journal ? getJournalIcon(journal.icon) : null;

	return (
		<View className="flex-1 bg-background" style={{paddingTop: insets.top}}>
			<View className="p-3 gap-1">
				<Button variant="ghost" size="sm" isIconOnly onPress={() => router.back()}>
					<ChevronLeft size={20} color={muted as string}/>
				</Button>
				<View className="flex-row items-center gap-3 ml-2 pb-2">
					{Icon ? <Icon size={28} color={muted as string}/> : null}
					<Text className="text-5xl font-heading text-foreground">
						{journal?.name ?? 'Journal'}
					</Text>
				</View>
			</View>

			{/* Search input */}
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					marginHorizontal: 16,
					marginBottom: 8,
					paddingHorizontal: 12,
					paddingVertical: 10,
					backgroundColor: surface as string,
					borderRadius: 12,
					borderWidth: 1,
					borderColor: border as string,
					gap: 8,
				}}
			>
				<Search size={16} color={muted as string}/>
				<TextInput
					value={searchQuery}
					onChangeText={handleSearch}
					placeholder="Search entries..."
					placeholderTextColor={muted as string}
					style={{flex: 1, fontSize: 15, color: foreground as string, padding: 0}}
				/>
			</View>

			<FlatList
				data={entries}
				keyExtractor={(item) => item.id}
				renderItem={({item}) => (
					<EntryCard
						entry={item}
						onPress={() => router.push(`/entry/${item.id}`)}
					/>
				)}
				contentContainerStyle={{
					paddingTop: 8,
					paddingBottom: insets.bottom + 16,
					paddingHorizontal: 16,
					gap: 12,
				}}
				ListEmptyComponent={
					<View className="items-center pt-12">
						<Text className="text-muted">No entries yet</Text>
					</View>
				}
			/>
		</View>
	);
}
