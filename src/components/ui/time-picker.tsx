import MaskedView from '@react-native-masked-view/masked-view';
import * as Haptics from 'expo-haptics';
import { Button } from 'heroui-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';

import { useThemeColors } from '@/hooks/use-theme-colors';
import { padTime } from '@/utils/format-time';

type Period = 'AM' | 'PM';
type FocusedUnit = 'hour' | 'minute';

interface TimePickerProps {
	readonly initialHour?: number;
	readonly initialMinute?: number;
	readonly onConfirm: (hour: number, minute: number) => void;
	readonly onCancel: () => void;
}

const DIAL_SIZE = 256;
const DIAL_RADIUS = DIAL_SIZE / 2;
const NUMBER_RADIUS = DIAL_RADIUS - 32;
const INDICATOR_RADIUS = 24;
const CENTER_DOT_RADIUS = 6;

function to12Hour(hour24: number): { hour12: number; period: Period } {
	if (hour24 === 0) return { hour12: 12, period: 'AM' };
	if (hour24 === 12) return { hour12: 12, period: 'PM' };
	if (hour24 > 12) return { hour12: hour24 - 12, period: 'PM' };
	return { hour12: hour24, period: 'AM' };
}

function to24Hour(hour12: number, period: Period): number {
	if (hour12 === 12) return period === 'AM' ? 0 : 12;
	return period === 'AM' ? hour12 : hour12 + 12;
}

function getAngleForHour(hour: number): number {
	return ((hour % 12) / 12) * 360 - 90;
}

function getAngleForMinute(minute: number): number {
	return (minute / 60) * 360 - 90;
}

function angleToPosition(angleDeg: number, radius: number): { x: number; y: number } {
	const rad = (angleDeg * Math.PI) / 180;
	return { x: DIAL_RADIUS + radius * Math.cos(rad), y: DIAL_RADIUS + radius * Math.sin(rad) };
}

function positionToValue(x: number, y: number, mode: FocusedUnit): number {
	const dx = x - DIAL_RADIUS;
	const dy = y - DIAL_RADIUS;
	let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
	if (angle < 0) angle += 360;

	if (mode === 'hour') {
		let hour = Math.round(angle / 30);
		if (hour === 0) hour = 12;
		return hour;
	}

	return Math.round(angle / 6) % 60;
}

const HOUR_NUMBERS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTE_NUMBERS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

interface DialNumberProps {
	readonly value: number;
	readonly angle: number;
	readonly color: string;
}

function DialNumber({ value, angle, color }: DialNumberProps): React.JSX.Element {
	const pos = angleToPosition(angle, NUMBER_RADIUS);
	return (
		<View
			style={{
				position: 'absolute',
				left: pos.x - 16,
				top: pos.y - 16,
				width: 32,
				height: 32,
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<Text style={{ fontSize: 14, fontWeight: '500', color }}>
				{value === 0 ? '00' : value}
			</Text>
		</View>
	);
}

interface DialNumbersLayerProps {
	readonly numbers: readonly number[];
	readonly color: string;
}

function DialNumbersLayer({ numbers, color }: DialNumbersLayerProps): React.JSX.Element {
	return (
		<View style={{ position: 'absolute', width: DIAL_SIZE, height: DIAL_SIZE }}>
			{numbers.map((value, index) => {
				const angle = (index / 12) * 360 - 90;
				return <DialNumber key={value} value={value} angle={angle} color={color} />;
			})}
		</View>
	);
}

export function TimePicker({
	initialHour = 21,
	initialMinute = 0,
	onConfirm,
	onCancel,
}: TimePickerProps): React.JSX.Element {
	const initial12 = to12Hour(initialHour);
	const [hour12, setHour12] = useState(initial12.hour12);
	const [minute, setMinute] = useState(initialMinute);
	const [period, setPeriod] = useState<Period>(initial12.period);
	const [focused, setFocused] = useState<FocusedUnit>('hour');

	const { accent, accentForeground, foreground } = useThemeColors();

	const currentAngle = focused === 'hour' ? getAngleForHour(hour12) : getAngleForMinute(minute);
	const indicatorPos = angleToPosition(currentAngle, NUMBER_RADIUS);

	const indicatorStyle = {
		position: 'absolute' as const,
		left: indicatorPos.x - INDICATOR_RADIUS,
		top: indicatorPos.y - INDICATOR_RADIUS,
		width: INDICATOR_RADIUS * 2,
		height: INDICATOR_RADIUS * 2,
		borderRadius: INDICATOR_RADIUS,
		backgroundColor: accent,
		alignItems: 'center' as const,
		justifyContent: 'center' as const,
	};

	const prevValueRef = useRef(focused === 'hour' ? hour12 : minute);

	const updateValue = useCallback(
		(x: number, y: number) => {
			const value = positionToValue(x, y, focused);
			if (value === prevValueRef.current) return;
			prevValueRef.current = value;
			Haptics.selectionAsync();
			if (focused === 'hour') {
				setHour12(value);
			} else {
				setMinute(value);
			}
		},
		[focused],
	);

	const panGesture = useMemo(
		() =>
			Gesture.Pan()
				.onUpdate((e) => {
					'worklet';
					const x = e.x;
					const y = e.y;
					runOnJS(updateValue)(x, y);
				})
				.hitSlop({ top: 10, bottom: 10, left: 10, right: 10 }),
		[updateValue],
	);

	const tapGesture = useMemo(
		() =>
			Gesture.Tap().onEnd((e) => {
				'worklet';
				runOnJS(updateValue)(e.x, e.y);
			}),
		[updateValue],
	);

	const composedGesture = useMemo(
		() => Gesture.Race(panGesture, tapGesture),
		[panGesture, tapGesture],
	);

	const handleConfirm = useCallback(() => {
		onConfirm(to24Hour(hour12, period), minute);
	}, [hour12, minute, period, onConfirm]);

	const numbers = focused === 'hour' ? HOUR_NUMBERS : MINUTE_NUMBERS;

	return (
		<View className="gap-6 items-center">
			<View className="flex-row items-center gap-2">
				<View className="flex-row items-center">
					<Pressable
						onPress={() => {
							setFocused('hour');
							prevValueRef.current = hour12;
						}}
						className={`rounded-xl px-4 py-3 ${
							focused === 'hour' ? 'bg-accent' : 'bg-surface'
						}`}
					>
						<Text
							className={`text-6xl font-semibold ${
								focused === 'hour' ? 'text-accent-foreground' : 'text-foreground'
							}`}
						>
							{padTime(hour12)}
						</Text>
					</Pressable>

					<Text className="text-6xl font-semibold text-foreground mx-1">:</Text>

					<Pressable
						onPress={() => {
							setFocused('minute');
							prevValueRef.current = minute;
						}}
						className={`rounded-xl px-4 py-3 ${
							focused === 'minute' ? 'bg-accent' : 'bg-surface'
						}`}
					>
						<Text
							className={`text-6xl font-semibold ${
								focused === 'minute' ? 'text-accent-foreground' : 'text-foreground'
							}`}
						>
							{padTime(minute)}
						</Text>
					</Pressable>
				</View>

				<View className="rounded-2xl overflow-hidden border border-border">
					{(['AM', 'PM'] as const).map((p) => (
						<Pressable
							key={p}
							onPress={() => setPeriod(p)}
							className={`rounded-2xl px-3 py-2 ${
								period === p ? 'bg-accent' : 'bg-surface'
							}`}
						>
							<Text
								className={`text-sm font-semibold ${
									period === p ? 'text-accent-foreground' : 'text-muted'
								}`}
							>
								{p}
							</Text>
						</Pressable>
					))}
				</View>
			</View>

			<GestureDetector gesture={composedGesture}>
				<View
					style={{ width: DIAL_SIZE, height: DIAL_SIZE }}
					className="rounded-full bg-surface items-center justify-center"
				>
					<Svg width={DIAL_SIZE} height={DIAL_SIZE} style={{ position: 'absolute' }}>
						<Circle
							cx={DIAL_RADIUS}
							cy={DIAL_RADIUS}
							r={CENTER_DOT_RADIUS}
							fill={accent}
						/>
						<Line
							x1={DIAL_RADIUS}
							y1={DIAL_RADIUS}
							x2={indicatorPos.x}
							y2={indicatorPos.y}
							stroke={accent}
							strokeWidth={2}
						/>
					</Svg>

					<DialNumbersLayer numbers={numbers} color={foreground} />

					<View style={indicatorStyle} />

					<MaskedView
						style={{ position: 'absolute', width: DIAL_SIZE, height: DIAL_SIZE }}
						maskElement={<View style={indicatorStyle} />}
					>
						<DialNumbersLayer numbers={numbers} color={accentForeground} />
					</MaskedView>
				</View>
			</GestureDetector>

			<View className="flex-row items-center justify-end gap-2 w-full">
				<Button variant="ghost" onPress={onCancel}>
					<Button.Label>Cancel</Button.Label>
				</Button>
				<Button variant="primary" onPress={handleConfirm}>
					<Button.Label>OK</Button.Label>
				</Button>
			</View>
		</View>
	);
}
