import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import type { GestureType } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

interface UseMenuDialGestureOptions {
	readonly itemCount: number;
	readonly centerX: number;
	readonly centerY: number;
	readonly highlightedIndex: SharedValue<number>;
	readonly onHighlightChange: (index: number) => void;
	readonly onConfirm: (index: number) => void;
	readonly onSelect: () => void;
}

interface UseMenuDialGestureReturn {
	readonly gesture: GestureType;
	readonly angle: SharedValue<number>;
	readonly highlightedIndex: SharedValue<number>;
	readonly tapProgress: SharedValue<number>;
}

function touchToAngle(touchX: number, touchY: number, centerX: number, centerY: number): number {
	'worklet';
	const dx = touchX - centerX;
	const dy = touchY - centerY;
	const rawAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
	return ((rawAngle % 360) + 360) % 360;
}

function angleDelta(newAngle: number, oldAngle: number): number {
	'worklet';
	return ((newAngle - oldAngle + 540) % 360) - 180;
}

function angleToIndex(normalizedAngle: number, itemCount: number): number {
	'worklet';
	if (itemCount <= 0) return 0;
	const sliceAngle = 360 / itemCount;
	const index = Math.floor(normalizedAngle / sliceAngle);
	return Math.min(index, itemCount - 1);
}

function triggerHaptic(): void {
	Haptics.selectionAsync();
}

export function useMenuDialGesture({
	itemCount,
	centerX,
	centerY,
	highlightedIndex,
	onHighlightChange,
	onConfirm,
	onSelect,
}: UseMenuDialGestureOptions): UseMenuDialGestureReturn {
	const angle = useSharedValue(0);
	const tapProgress = useSharedValue(0);

	const previousAngle = useSharedValue(0);
	const cumulativeRotation = useSharedValue(0);

	const panGesture = useMemo(
		() =>
			Gesture.Pan()
				.onBegin((e) => {
					'worklet';
					const currentAngle = touchToAngle(e.x, e.y, centerX, centerY);
					previousAngle.value = currentAngle;
					cumulativeRotation.value = 0;
				})
				.onUpdate((e) => {
					'worklet';
					const currentAngle = touchToAngle(e.x, e.y, centerX, centerY);
					const delta = angleDelta(currentAngle, previousAngle.value);
					cumulativeRotation.value += delta;
					previousAngle.value = currentAngle;

					angle.value = currentAngle;

					const newIndex = angleToIndex(currentAngle, itemCount);
					if (newIndex !== highlightedIndex.value) {
						highlightedIndex.value = newIndex;
						runOnJS(triggerHaptic)();
						runOnJS(onHighlightChange)(newIndex);
					}
				})
				.hitSlop({ top: 10, bottom: 10, left: 10, right: 10 }),
		[
			itemCount,
			centerX,
			centerY,
			onHighlightChange,
			angle,
			highlightedIndex,
			previousAngle,
			cumulativeRotation,
		],
	);

	const doubleTapGesture = useMemo(
		() =>
			Gesture.Tap()
				.numberOfTaps(2)
				.maxDelay(200)
				.onEnd(() => {
					'worklet';
					tapProgress.value = withSequence(
						withTiming(1, { duration: 100 }),
						withTiming(0, { duration: 200 }),
					);
					runOnJS(triggerHaptic)();
					runOnJS(onConfirm)(highlightedIndex.value);
				}),
		[onConfirm, highlightedIndex, tapProgress],
	);

	const singleTapGesture = useMemo(
		() =>
			Gesture.Tap().onEnd(() => {
				'worklet';
				tapProgress.value = withSequence(
					withTiming(1, { duration: 100 }),
					withTiming(0, { duration: 200 }),
				);
				runOnJS(triggerHaptic)();
				runOnJS(onSelect)();
			}),
		[onSelect, tapProgress],
	);

	const tapGesture = useMemo(
		() => Gesture.Exclusive(doubleTapGesture, singleTapGesture),
		[doubleTapGesture, singleTapGesture],
	);

	const gesture = useMemo(() => Gesture.Race(panGesture, tapGesture), [panGesture, tapGesture]);

	return useMemo(
		() => ({ gesture, angle, highlightedIndex, tapProgress }),
		[gesture, angle, highlightedIndex, tapProgress],
	);
}

export type { UseMenuDialGestureReturn };
