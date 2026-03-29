import { Button } from 'heroui-native';
import React, { useCallback, useImperativeHandle, useRef, useState } from 'react';
import { Dimensions, FlatList, View, type ViewToken } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface OnboardingAction {
	readonly label: string;
	readonly onPress: () => void;
}

export interface OnboardingPage {
	readonly key: string;
	readonly content: React.ReactNode;
	readonly cta: OnboardingAction;
	readonly secondaryAction?: OnboardingAction;
}

export interface OnboardingPagerHandle {
	goToNext: () => void;
}

interface OnboardingPagerProps {
	readonly pages: readonly OnboardingPage[];
}

function DotIndicator({
	count,
	activeIndex,
}: {
	readonly count: number;
	readonly activeIndex: number;
}): React.JSX.Element {
	return (
		<View className="flex-row gap-2">
			{Array.from({ length: count }, (_, i) => (
				<View
					key={i}
					className={`h-2 w-2 rounded-full ${i === activeIndex ? 'bg-foreground' : 'bg-foreground/20'}`}
				/>
			))}
		</View>
	);
}

export const OnboardingPager = React.forwardRef<OnboardingPagerHandle, OnboardingPagerProps>(
	function OnboardingPager({ pages }, ref) {
		const [activeIndex, setActiveIndex] = useState(0);
		const flatListRef = useRef<FlatList>(null);

		const activePage = pages[activeIndex]!;

		useImperativeHandle(
			ref,
			() => ({
				goToNext() {
					const next = activeIndex + 1;
					if (next < pages.length) {
						flatListRef.current?.scrollToIndex({ index: next, animated: true });
					}
				},
			}),
			[activeIndex, pages.length],
		);

		const handleViewableItemsChanged = useCallback(
			({ viewableItems }: { viewableItems: ViewToken[] }) => {
				const first = viewableItems[0];
				if (first?.index !== null && first?.index !== undefined) {
					setActiveIndex(first.index);
				}
			},
			[],
		);

		const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

		return (
			<View className="flex-1 bg-background">
				<FlatList
					ref={flatListRef}
					data={pages}
					horizontal
					pagingEnabled
					showsHorizontalScrollIndicator={false}
					keyExtractor={(page) => page.key}
					renderItem={({ item }) => (
						<View style={{ width: SCREEN_WIDTH }} className="flex-1">
							{item.content}
						</View>
					)}
					onViewableItemsChanged={handleViewableItemsChanged}
					viewabilityConfig={viewabilityConfig}
				/>

				<View className="flex-row items-center justify-between px-8 pb-12">
					<DotIndicator count={pages.length} activeIndex={activeIndex} />

					<View className="flex-row items-center gap-4">
						{activePage.secondaryAction !== undefined ? (
							<Button variant="ghost" onPress={activePage.secondaryAction.onPress}>
								<Button.Label>{activePage.secondaryAction.label}</Button.Label>
							</Button>
						) : null}

						<Button variant="primary" onPress={activePage.cta.onPress}>
							<Button.Label>{activePage.cta.label}</Button.Label>
						</Button>
					</View>
				</View>
			</View>
		);
	},
);
