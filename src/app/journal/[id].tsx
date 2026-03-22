import {ChevronLeft, Plus, Search} from 'lucide-react-native';
import {router, useLocalSearchParams} from 'expo-router';
import React, {useCallback, useState} from 'react';
import {FlatList, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Button} from 'heroui-native';

import {EntryCard} from '@/components/entry-card';
import {getJournalIcon} from '@/constants/journal-icons';
import {useEntries} from '@/hooks/use-entries';
import {useJournals} from '@/hooks/use-journals';
import {useThemeColors} from '@/hooks/use-theme-colors';
import type {Entry} from '@/types/entry';

export default function JournalDetailScreen(): React.JSX.Element {
	const {id} = useLocalSearchParams<{ id: string }>();
	const insets = useSafeAreaInsets();
	const {muted, surface, foreground, border, accentForeground} = useThemeColors();

	const {journals} = useJournals();
	const journal = journals.find((j) => j.id === id);
	const {entries, searchEntries, createEntry} = useEntries(id);
	const [searchQuery, setSearchQuery] = useState('');

	const handleSearch = useCallback(
		async (query: string) => {
			setSearchQuery(query);
			await searchEntries(query);
		},
		[searchEntries],
	);

	const handleNewEntry = useCallback(async () => {
		if (!id) return;
		const entry = await createEntry(id, '', '');
		router.push(`/entry/${entry.id}/edit`);
	}, [id, createEntry]);

	const Icon = journal ? getJournalIcon(journal.icon) : null;

	return (
		<View className="flex-1 bg-background" style={{paddingTop: insets.top}}>
			<View className="p-3 gap-1">
				<Button variant="ghost" size="sm" isIconOnly onPress={() => router.back()}>
					<ChevronLeft size={20} color={muted}/>
				</Button>
				<View className="flex-row items-center gap-3 ml-2 pb-2">
					{Icon ? <Icon size={28} color={muted}/> : null}
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
					backgroundColor: surface,
					borderRadius: 12,
					borderWidth: 1,
					borderColor: border,
					gap: 8,
				}}
			>
				<Search size={16} color={muted}/>
				<TextInput
					value={searchQuery}
					onChangeText={handleSearch}
					placeholder="Search entries..."
					placeholderTextColor={muted}
					style={{flex: 1, fontSize: 15, color: foreground, padding: 0}}
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

			<Button
				variant="primary"
				size="lg"
				isIconOnly
				onPress={handleNewEntry}
				className="absolute bottom-8 right-5 w-14 h-14 rounded-full shadow-2xl"
				style={{bottom: insets.bottom + 16}}
			>
				<Plus size={24} color={accentForeground}/>
			</Button>
		</View>
	);
}
