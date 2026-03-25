import { ChevronRight } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
	Easing,
} from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/use-theme-colors';

interface CollapsibleProps {
	/** Section header text. */
	readonly title: string;
	/** Optional badge content rendered on the right side of the header. */
	readonly badge?: React.ReactNode;
	/** Whether the section starts expanded. Defaults to false. */
	readonly defaultExpanded?: boolean;
	readonly children: React.ReactNode;
}

const TIMING_CONFIG = { duration: 250, easing: Easing.out(Easing.cubic) };

export function Collapsible({
	title,
	badge,
	defaultExpanded = false,
	children,
}: CollapsibleProps): React.JSX.Element {
	const { foreground, muted } = useThemeColors();
	const [isExpanded, setIsExpanded] = useState(defaultExpanded);
	const contentHeight = useSharedValue(defaultExpanded ? 1 : 0);
	const chevronRotation = useSharedValue(defaultExpanded ? 90 : 0);
	const measuredHeight = useSharedValue(0);
	const [hasMeasured, setHasMeasured] = useState(false);

	const onLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const height = event.nativeEvent.layout.height;
			if (height > 0) {
				measuredHeight.value = height;
				if (!hasMeasured) {
					setHasMeasured(true);
					if (defaultExpanded) {
						contentHeight.value = 1;
					}
				}
			}
		},
		[measuredHeight, contentHeight, hasMeasured, defaultExpanded],
	);

	const toggle = useCallback(() => {
		const willExpand = !isExpanded;
		setIsExpanded(willExpand);
		contentHeight.value = withTiming(willExpand ? 1 : 0, TIMING_CONFIG);
		chevronRotation.value = withTiming(willExpand ? 90 : 0, TIMING_CONFIG);
	}, [isExpanded, contentHeight, chevronRotation]);

	const containerStyle = useAnimatedStyle(() => ({
		height: hasMeasured
			? contentHeight.value * measuredHeight.value
			: contentHeight.value > 0
				? undefined
				: 0,
		opacity: contentHeight.value,
		overflow: 'hidden' as const,
	}));

	const chevronStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${chevronRotation.value}deg` }],
	}));

	return (
		<View>
			<Pressable
				onPress={toggle}
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
					paddingVertical: 10,
					paddingHorizontal: 4,
				}}
			>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
					<Animated.View style={chevronStyle}>
						<ChevronRight size={16} color={muted} />
					</Animated.View>
					<Text style={{ fontSize: 15, fontWeight: '600', color: foreground }}>
						{title}
					</Text>
				</View>
				{badge ?? null}
			</Pressable>

			<Animated.View style={containerStyle}>
				<View
					onLayout={onLayout}
					style={{ position: hasMeasured ? 'relative' : 'absolute', width: '100%' }}
				>
					{children}
				</View>
			</Animated.View>
		</View>
	);
}
