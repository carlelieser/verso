import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import type { AnimationObject } from 'lottie-react-native';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LottieTabIcon } from '@/components/ui/lottie-tab-icon';
import { useThemeColors } from '@/hooks/use-theme-colors';

import editLottie from '../../../assets/animation/edit.json';
import historyLottie from '../../../assets/animation/history.json';
import homeLottie from '../../../assets/animation/home.json';
import settingsLottie from '../../../assets/animation/settings.json';

interface TabEntry {
	readonly name: string;
	readonly label: string;
	readonly lottie: AnimationObject;
}

const TABS: readonly TabEntry[] = [
	{ name: 'journals', label: 'Journals', lottie: homeLottie as AnimationObject },
	{ name: 'new-entry', label: 'New entry', lottie: editLottie as AnimationObject },
	{ name: 'history', label: 'History', lottie: historyLottie as AnimationObject },
	{ name: 'settings', label: 'Settings', lottie: settingsLottie as AnimationObject },
];

const TAB_WIDTH = 72;
const TAB_HEIGHT = 64;
const INDICATOR_SIZE = 52;
const SPRING_CONFIG = { damping: 22, stiffness: 200, mass: 0.5 };

export default function TabsLayout(): React.JSX.Element {
	const { background } = useThemeColors();

	const renderTabBar = useCallback((props: BottomTabBarProps) => <CustomTabBar {...props} />, []);

	const screenOptions = useMemo(
		() => ({
			headerShown: false,
			animation: 'shift' as const,
			sceneStyle: { backgroundColor: background },
		}),
		[background],
	);

	return (
		<Tabs screenOptions={screenOptions} tabBar={renderTabBar}>
			{TABS.map((tab) => (
				<Tabs.Screen key={tab.name} name={tab.name} />
			))}
		</Tabs>
	);
}

function CustomTabBar({ state, navigation }: BottomTabBarProps): React.JSX.Element {
	const insets = useSafeAreaInsets();
	const { muted, foreground, accent, surface, border } = useThemeColors();

	const activeRouteName = state.routes[state.index]?.name;
	const tabEntries = useMemo(
		() =>
			TABS.map((tab) => {
				const route = state.routes.find((r) => r.name === tab.name);
				return { tab, route };
			}).filter((entry): entry is { tab: TabEntry; route: (typeof state.routes)[number] } =>
				Boolean(entry.route),
			),
		[state.routes],
	);

	const indicatorX = useSharedValue(0);

	const visualIndex = useMemo(() => {
		const idx = tabEntries.findIndex((e) => e.route.name === activeRouteName);
		return idx < 0 ? 0 : idx;
	}, [tabEntries, activeRouteName]);

	useEffect(() => {
		const targetX = visualIndex * TAB_WIDTH + (TAB_WIDTH - INDICATOR_SIZE) / 2;
		indicatorX.value = withSpring(targetX, SPRING_CONFIG);
	}, [visualIndex, indicatorX]);

	const indicatorStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: indicatorX.value }],
	}));

	const handlePress = useCallback(
		(routeName: string, routeKey: string) => {
			const event = navigation.emit({
				type: 'tabPress',
				target: routeKey,
				canPreventDefault: true,
			});
			if (!event.defaultPrevented) {
				navigation.navigate(routeName);
			}
		},
		[navigation],
	);

	return (
		<View
			style={{
				paddingBottom: insets.bottom,
				backgroundColor: surface,
				borderTopColor: border,
			}}
			className="border-t"
		>
			<View className="items-center" style={{ height: TAB_HEIGHT }}>
				<View
					className="flex-row items-center relative"
					style={{ height: TAB_HEIGHT, width: TAB_WIDTH * tabEntries.length }}
				>
					<Animated.View
						style={[
							{
								position: 'absolute',
								left: 0,
								top: (TAB_HEIGHT - INDICATOR_SIZE) / 2,
								width: INDICATOR_SIZE,
								height: INDICATOR_SIZE,
								borderRadius: INDICATOR_SIZE / 2,
								backgroundColor: accent,
								opacity: 0.08,
							},
							indicatorStyle,
						]}
					/>
					{tabEntries.map(({ tab, route }) => {
						const isFocused = route.name === activeRouteName;
						return (
							<Pressable
								key={route.key}
								onPress={() => handlePress(route.name, route.key)}
								accessibilityRole="tab"
								accessibilityLabel={tab.label}
								accessibilityState={{ selected: isFocused }}
								style={{
									width: TAB_WIDTH,
									height: TAB_HEIGHT,
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<LottieTabIcon
									source={tab.lottie}
									isFocused={isFocused}
									focusedColor={foreground}
									inactiveColor={muted}
								/>
							</Pressable>
						);
					})}
				</View>
			</View>
		</View>
	);
}
