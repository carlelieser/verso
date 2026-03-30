import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AttachmentPreview } from '@/components/entry/attachment-preview';
import { EntryViewer } from '@/components/entry/entry-viewer';
import { MoodCard } from '@/components/entry/mood-card';
import { WeatherCard } from '@/components/entry/weather-card';
import { ScreenLayout } from '@/components/layout/screen-layout';
import { Section } from '@/components/layout/section';
import { Fab } from '@/components/ui/fab';
import { FabMenu, type FabMenuItem } from '@/components/ui/fab-menu';
import { useDeleteEntry } from '@/hooks/use-delete-entry';
import { useEntries } from '@/hooks/use-entries';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { EntryDetail } from '@/types/entry';
import { formatRelativeDate } from '@/utils/date';

export default function EntryViewScreen(): React.JSX.Element {
	const { journalId, entryId } = useLocalSearchParams<{ journalId: string; entryId: string }>();
	const insets = useSafeAreaInsets();
	const { danger, foreground, accentForeground } = useThemeColors();
	const { loadEntry, deleteEntry } = useEntries();
	const { confirmDeleteEntry } = useDeleteEntry(deleteEntry);
	const [entry, setEntry] = useState<EntryDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const handleDelete = useCallback(async () => {
		if (!entryId) return;
		const deleted = await confirmDeleteEntry(entryId);
		if (deleted) router.back();
	}, [entryId, confirmDeleteEntry]);

	const menuItems: readonly FabMenuItem[] = useMemo(
		() => [
			{
				id: 'delete',
				label: 'Delete',
				icon: <Trash2 size={16} color={danger} />,
				variant: 'danger',
				onPress: handleDelete,
			},
		],
		[danger, handleDelete],
	);

	useFocusEffect(
		useCallback(() => {
			let isActive = true;

			if (entryId) {
				loadEntry(entryId)
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
		}, [entryId, loadEntry]),
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
						className="flex-1 rounded-t-4xl"
						contentContainerClassName="px-5 gap-4"
						contentContainerStyle={{ paddingBottom: insets.bottom + 188 }}
					>
						<Text className="text-4xl font-heading text-foreground mb-4 pb-2">
							{formatRelativeDate(entry.createdAt)}
						</Text>

						{entry.emotions.length > 0 ? (
							<Section label="Mood">
								<MoodCard emotions={entry.emotions} />
							</Section>
						) : null}

						{entry.weather ? (
							<Section label="Weather">
								<WeatherCard weather={entry.weather} />
							</Section>
						) : null}

						{entry.attachments.length > 0 ? (
							<Section label="Attachments">
								<AttachmentPreview
									journalId={journalId}
									entryId={entryId}
									attachments={entry.attachments}
								/>
							</Section>
						) : null}

						<View className="-mx-5">
							<EntryViewer key={entry.updatedAt} html={entry.contentHtml} />
						</View>
					</ScrollView>

					<Fab
						icon={<Pencil size={20} color={accentForeground} />}
						onPress={() => router.push(`/journal/${journalId}/entry/${entryId}/edit`)}
						className="absolute right-4"
						style={{ bottom: insets.bottom + 16 }}
					/>

					<FabMenu
						icon={<EllipsisVertical size={24} color={foreground} />}
						items={menuItems}
						className="absolute right-4"
						style={{ bottom: insets.bottom + 98 }}
					/>
				</>
			)}

		</ScreenLayout>
	);
}
