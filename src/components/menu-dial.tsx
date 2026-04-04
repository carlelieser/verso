import { ChevronRight } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

import { MenuDialCanvas } from '@/components/menu-dial-canvas';
import { useMenuDialGesture } from '@/hooks/use-menu-dial-gesture';
import { useMenuDialNavigation } from '@/hooks/use-menu-dial-navigation';
import type { MenuItem } from '@/hooks/use-menu-dial-navigation';
import { useThemeColors } from '@/hooks/use-theme-colors';

export type { MenuItem };

interface MenuDialProps {
	readonly items: MenuItem[];
	readonly onSelect: (path: string[]) => void;
}

const DIAL_SIZE = 256;
const DIAL_CENTER = DIAL_SIZE / 2;
const DIAL_STYLE = { width: DIAL_SIZE, height: DIAL_SIZE } as const;

export const MenuDial = React.memo(function MenuDial({
	items,
	onSelect,
}: MenuDialProps): React.JSX.Element {
	const { foreground, muted, accent } = useThemeColors();

	const gestureHighlightedIndex = useSharedValue(0);

	const handleReset = useCallback(() => {
		gestureHighlightedIndex.value = 0;
	}, [gestureHighlightedIndex]);

	const navigation = useMenuDialNavigation({ items, onSelect, onReset: handleReset });

	const sliceColors = useMemo(
		() => navigation.currentItems.map((item) => item.color ?? foreground),
		[navigation.currentItems, foreground],
	);

	const { gesture, tapProgress } = useMenuDialGesture({
		itemCount: navigation.currentItems.length,
		centerX: DIAL_CENTER,
		centerY: DIAL_CENTER,
		onHighlightChange: navigation.setHighlightedIndex,
		onConfirm: navigation.confirmItem,
		onSelect: navigation.selectCurrent,
		highlightedIndex: gestureHighlightedIndex,
	});

	return (
		<View className="flex-col items-center gap-4">
			<View className="flex-row items-center gap-1">
				{navigation.breadcrumbs.map((segment, i) => {
					const isLast = i === navigation.breadcrumbs.length - 1;
					return (
						<View key={segment.depth} className="flex-row items-center gap-1">
							{i > 0 && <ChevronRight size={14} color={muted} />}
							<Pressable
								onPress={() =>
									isLast
										? navigation.selectCurrent()
										: navigation.navigateToDepth(segment.depth)
								}
							>
								<Text
									className={`text-sm ${isLast ? 'font-semibold text-foreground' : 'text-muted'}`}
								>
									{segment.label}
								</Text>
							</Pressable>
						</View>
					);
				})}
			</View>

			<GestureDetector gesture={gesture}>
				<View style={DIAL_STYLE}>
					<MenuDialCanvas
						size={DIAL_SIZE}
						highlightedIndex={gestureHighlightedIndex}
						itemCount={navigation.currentItems.length}
						sliceColors={sliceColors}
						tapProgress={tapProgress}
						ringOpacity={navigation.ringOpacity}
						ringScale={navigation.ringScale}
						centerColor={muted}
						accentColor={accent}
						activeArcColor={navigation.currentColor ?? foreground}
						indicatorColor={foreground}
					/>
				</View>
			</GestureDetector>
		</View>
	);
});
