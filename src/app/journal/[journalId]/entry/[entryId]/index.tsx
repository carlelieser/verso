import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppDialog } from '@/components/app-dialog';
import { AttachmentPreview } from '@/components/attachment-preview';
import { Fab } from '@/components/fab';
import { FabMenu, type FabMenuItem } from '@/components/fab-menu';
import { MoodCard } from '@/components/mood-card';
import { ScreenLayout } from '@/components/screen-layout';
import { Section } from '@/components/section';
import { WeatherCard } from '@/components/weather-card';
import { useDialog } from '@/hooks/use-dialog';
import { useEntries } from '@/hooks/use-entries';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { EntryDetail } from '@/types/entry';
import { formatRelativeDate } from '@/utils/date';

export default function EntryViewScreen(): React.JSX.Element {
	const { journalId, entryId } = useLocalSearchParams<{ journalId: string; entryId: string }>();
	const insets = useSafeAreaInsets();
	const { danger, foreground, accentForeground } = useThemeColors();
	const { loadEntry, deleteEntry } = useEntries();
	const dialog = useDialog();
	const [entry, setEntry] = useState<EntryDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const handleDelete = useCallback(async () => {
		if (!entryId) return;

		const confirmed = await dialog.confirm({
			title: 'Delete Entry',
			description: 'This entry will be permanently deleted. This cannot be undone.',
			confirmLabel: 'Delete',
			variant: 'danger',
		});

		if (!confirmed) return;

		await deleteEntry(entryId);
		router.back();
	}, [entryId, deleteEntry, dialog]);

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
						contentContainerClassName="px-5"
						contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
					>
						<Text className="text-4xl font-heading text-foreground mb-4 pb-2">
							{formatRelativeDate(entry.createdAt)}
						</Text>

						{entry.emotions.length > 0 ? (
							<Section label="MOOD">
								<MoodCard emotions={entry.emotions} />
							</Section>
						) : null}

						{entry.weather ? (
							<Section label="WEATHER">
								<WeatherCard weather={entry.weather} />
							</Section>
						) : null}

						{entry.attachments.length > 0 ? (
							<Section label="ATTACHMENTS">
								<AttachmentPreview
									journalId={journalId}
									entryId={entryId}
									attachments={entry.attachments}
								/>
							</Section>
						) : null}

						<Text
							className="font-editor text-foreground"
							style={{ fontSize: 17, lineHeight: 28 }}
						>
							{entry.contentText}
						</Text>
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

			<AppDialog
				{...dialog.state}
				onConfirm={dialog.handleConfirm}
				onCancel={dialog.handleCancel}
			/>
		</ScreenLayout>
	);
}
