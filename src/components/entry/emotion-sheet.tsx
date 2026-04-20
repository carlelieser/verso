import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Portal } from '@gorhom/portal';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { EmotionIntensityList } from '@/components/entry/emotion-intensity-list';
import { MenuDial } from '@/components/menu-dial';
import { FEELING_WHEEL } from '@/constants/emotions';
import type { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useConfirmDialog } from '@/providers/dialog-provider';
import { useEntryContext } from '@/providers/entry-provider';
import type { EmotionCategory, EmotionIntensity } from '@/types/common';
import { isEmotionCategory } from '@/types/common';
import type { EmotionSelection } from '@/types/emotion';

const DEFAULT_INTENSITY: EmotionIntensity = 3;

function isDraftDirty(
	draft: readonly EmotionSelection[],
	committed: readonly EmotionSelection[],
): boolean {
	if (draft.length !== committed.length) return true;
	return draft.some(
		(s, i) => s.emotion !== committed[i]?.emotion || s.intensity !== committed[i]?.intensity,
	);
}

interface EmotionSheetProps {
	readonly sheet: ReturnType<typeof useBottomSheet>;
}

export function EmotionSheet({ sheet }: EmotionSheetProps): React.JSX.Element | null {
	const { entryId, emotions, setEmotions } = useEntryContext();
	const dialog = useConfirmDialog();

	const [draft, setDraft] = useState<readonly EmotionSelection[]>(() => [...emotions]);
	const draftRef = useRef(draft);
	draftRef.current = draft;
	const committingRef = useRef(false);

	const dirty = isDraftDirty(draft, emotions);

	const handleSelect = useCallback((path: string[]) => {
		const emotionKey = path[path.length - 1];
		if (!emotionKey || !isEmotionCategory(emotionKey)) return;

		setDraft((prev) => {
			if (prev.some((s) => s.emotion === emotionKey)) return prev;
			return [...prev, { emotion: emotionKey, intensity: DEFAULT_INTENSITY }];
		});
	}, []);

	const handleIntensityChange = useCallback(
		(emotion: EmotionCategory, intensity: EmotionIntensity) => {
			setDraft((prev) => prev.map((s) => (s.emotion === emotion ? { ...s, intensity } : s)));
		},
		[],
	);

	const handleDone = useCallback(() => {
		committingRef.current = true;
		setEmotions(draft);
		sheet.close();
	}, [draft, setEmotions, sheet]);

	const handleReset = useCallback(async () => {
		const confirmed = await dialog.confirm({
			title: 'Reset Emotions',
			description: 'All selected emotions will be cleared.',
			confirmLabel: 'Reset',
			variant: 'danger',
		});
		if (confirmed) {
			setDraft([]);
			setEmotions([]);
		}
	}, [dialog, setEmotions]);

	const handleAnimate = useCallback(
		(_fromIndex: number, toIndex: number) => {
			if (toIndex !== -1) return;
			if (committingRef.current) {
				committingRef.current = false;
				return;
			}
			if (!isDraftDirty(draftRef.current, emotions)) return;

			sheet.ref.current?.snapToIndex(0);

			dialog
				.confirm({
					title: 'Discard Changes',
					description: 'Your emotion changes will be lost.',
					confirmLabel: 'Discard',
					variant: 'danger',
				})
				.then((confirmed) => {
					if (confirmed) {
						sheet.close();
					}
				});
		},
		[emotions, sheet, dialog],
	);

	const sheetProps = useMemo(
		() => ({
			...sheet.sheetProps,
			onAnimate: handleAnimate,
			enablePanDownToClose: !dirty,
		}),
		[sheet.sheetProps, handleAnimate, dirty],
	);

	if (!sheet.isOpen) return null;

	return (
		<Portal>
			<BottomSheet ref={sheet.ref} {...sheetProps}>
				<BottomSheetScrollView>
					<View key={entryId} className="pt-6 pb-12 gap-6">
						<View className="gap-1 px-6">
							<Text className="text-3xl font-heading text-foreground pb-1">
								How are you feeling?
							</Text>
							<Text className="text-xs text-muted leading-5">
								Drag your finger around to select. Double-tap to get more specific.
								Tap to add.
							</Text>
						</View>

						<View className="items-center">
							<MenuDial items={FEELING_WHEEL} onSelect={handleSelect} />
						</View>

						<EmotionIntensityList
							selections={draft}
							onIntensityChange={handleIntensityChange}
							onDone={handleDone}
							onReset={handleReset}
						/>
					</View>
				</BottomSheetScrollView>
			</BottomSheet>
		</Portal>
	);
}
