import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Pencil } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EntryMetaCard } from '@/components/entry-meta-card';
import { Fab } from '@/components/fab';
import { ScreenLayout } from '@/components/screen-layout';
import { useEntries } from '@/hooks/use-entries';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { EntryDetail } from '@/types/entry';

export default function EntryViewScreen(): React.JSX.Element {
	const { id } = useLocalSearchParams<{ id: string }>();
	const insets = useSafeAreaInsets();
	const { accentForeground } = useThemeColors();
	const { loadEntry } = useEntries();
	const [entry, setEntry] = useState<EntryDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useFocusEffect(
		useCallback(() => {
			let isActive = true;

			if (id) {
				loadEntry(id)
					.then((result) => {
						if (isActive) {
							setEntry(result);
							setIsLoading(false);
						}
					})
					.catch(() => {
						if (isActive) {
							setEntry(null);
							setIsLoading(false);
						}
					});
			}

			return () => {
				isActive = false;
			};
		}, [id, loadEntry]),
	);

	return (
		<ScreenLayout>
			{isLoading || !entry ? (
				<View className="flex-1 items-center justify-center">
					<Text className="text-muted">
						{isLoading ? 'Loading...' : 'Entry not found'}
					</Text>
				</View>
			) : (
				<>
					<ScrollView
						contentContainerClassName="px-5"
						contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
					>
						<EntryMetaCard entry={entry} />

						<Text
							className="font-editor text-foreground"
							style={{ fontSize: 17, lineHeight: 28 }}
						>
							{entry.contentText}
						</Text>
					</ScrollView>

					<Fab
						icon={<Pencil size={20} color={accentForeground} />}
						onPress={() => router.push(`/entry/${id}/edit`)}
						className="absolute right-4"
						style={{ bottom: insets.bottom + 16 }}
					/>
				</>
			)}
		</ScreenLayout>
	);
}
