import {
	Canvas,
	Circle,
	Group,
	interpolateColors,
	Line,
	Path,
	Skia,
	usePathValue,
	vec,
} from '@shopify/react-native-skia';
import type { SkRect, Transforms3d } from '@shopify/react-native-skia';
import React, { useMemo } from 'react';
import { useDerivedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

interface MenuDialCanvasProps {
	readonly size: number;
	readonly highlightedIndex: SharedValue<number>;
	readonly itemCount: number;
	readonly sliceColors: readonly string[];
	readonly tapProgress: SharedValue<number>;
	readonly ringOpacity: SharedValue<number>;
	readonly ringScale: SharedValue<number>;
	readonly centerColor: string;
	readonly accentColor: string;
	readonly activeArcColor: string;
	readonly indicatorColor: string;
}

const INDICATOR_STROKE_WIDTH = 8;
const OUTER_INSET = 8;

const INACTIVE_RADIUS_SHRINK = 12;
const INACTIVE_OPACITY = 0.12;

const CENTER_TAP_SCALE = 0.9;

export function MenuDialCanvas({
	size,
	highlightedIndex,
	itemCount,
	sliceColors,
	tapProgress,
	ringOpacity,
	ringScale,
	centerColor,
	accentColor,
	activeArcColor,
	indicatorColor,
}: MenuDialCanvasProps): React.JSX.Element {
	const center = size / 2;
	const outerRadius = center - OUTER_INSET;
	const inactiveRadius = outerRadius - INACTIVE_RADIUS_SHRINK;
	const centerRadius = size * 0.18;
	const trackGap = 4;
	const trackRadius = centerRadius + trackGap + INDICATOR_STROKE_WIDTH / 2;

	const sliceAngle = itemCount > 0 ? 360 / itemCount : 360;

	const outerOval: SkRect = useMemo(
		() => ({
			x: center - outerRadius,
			y: center - outerRadius,
			width: outerRadius * 2,
			height: outerRadius * 2,
		}),
		[center, outerRadius],
	);

	const inactiveOval: SkRect = useMemo(
		() => ({
			x: center - inactiveRadius,
			y: center - inactiveRadius,
			width: inactiveRadius * 2,
			height: inactiveRadius * 2,
		}),
		[center, inactiveRadius],
	);

	const trackOval: SkRect = useMemo(
		() => ({
			x: center - trackRadius,
			y: center - trackRadius,
			width: trackRadius * 2,
			height: trackRadius * 2,
		}),
		[center, trackRadius],
	);

	const activeSlicePath = usePathValue((path) => {
		'worklet';
		const startAngle = highlightedIndex.value * sliceAngle - 90;
		const startRad = (startAngle * Math.PI) / 180;
		path.moveTo(center, center);
		path.lineTo(
			center + outerRadius * Math.cos(startRad),
			center + outerRadius * Math.sin(startRad),
		);
		path.addArc(outerOval, startAngle, sliceAngle);
		path.lineTo(center, center);
		path.close();
	});

	const indicatorPath = usePathValue((path) => {
		'worklet';
		const startAngle = highlightedIndex.value * sliceAngle - 90;
		path.addArc(trackOval, startAngle, sliceAngle);
	});

	const inactiveSlicePaths = useMemo(() => {
		return Array.from({ length: itemCount }, (_, i) => {
			const startAngle = i * sliceAngle - 90;
			const startRad = (startAngle * Math.PI) / 180;
			const path = Skia.Path.Make();
			path.moveTo(center, center);
			path.lineTo(
				center + inactiveRadius * Math.cos(startRad),
				center + inactiveRadius * Math.sin(startRad),
			);
			path.addArc(inactiveOval, startAngle, sliceAngle);
			path.lineTo(center, center);
			path.close();
			return path;
		});
	}, [itemCount, sliceAngle, center, inactiveRadius, inactiveOval]);

	const segmentLines = useMemo(() => {
		if (itemCount <= 1) return [];
		const trackInner = trackRadius - INDICATOR_STROKE_WIDTH / 2;
		const trackOuter = trackRadius + INDICATOR_STROKE_WIDTH / 2;
		return Array.from({ length: itemCount }, (_, i) => {
			const angleDeg = i * sliceAngle - 90;
			const rad = (angleDeg * Math.PI) / 180;
			const cos = Math.cos(rad);
			const sin = Math.sin(rad);
			return {
				x1: center + trackInner * cos,
				y1: center + trackInner * sin,
				x2: center + trackOuter * cos,
				y2: center + trackOuter * sin,
			};
		});
	}, [itemCount, sliceAngle, center, trackRadius]);

	const origin = useMemo(() => vec(center, center), [center]);

	const transform = useDerivedValue<Transforms3d>(
		() => [{ scale: ringScale.value }],
		[ringScale],
	);

	const centerCircleRadius = useDerivedValue(
		() => centerRadius * (1 - tapProgress.value * (1 - CENTER_TAP_SCALE)),
		[centerRadius, tapProgress],
	);

	const centerCircleColor = useDerivedValue(
		() => interpolateColors(tapProgress.value, [0, 1], [centerColor, accentColor]),
		[tapProgress, centerColor, accentColor],
	);

	const canvasStyle = useMemo(() => ({ width: size, height: size }), [size]);

	return (
		<Canvas style={canvasStyle}>
			<Group opacity={ringOpacity} transform={transform} origin={origin}>
				{inactiveSlicePaths.map((path, i) => (
					<Path
						key={i}
						path={path}
						style="fill"
						color={sliceColors[i] ?? indicatorColor}
						opacity={INACTIVE_OPACITY}
					/>
				))}

				<Path path={activeSlicePath} style="fill" color={activeArcColor} />

				{segmentLines.map((line, i) => (
					<Line
						key={i}
						p1={vec(line.x1, line.y1)}
						p2={vec(line.x2, line.y2)}
						style="stroke"
						strokeWidth={0.5}
						color={centerColor}
					/>
				))}

				<Circle
					cx={center}
					cy={center}
					r={trackRadius}
					style="stroke"
					strokeWidth={INDICATOR_STROKE_WIDTH}
					color={indicatorColor}
					opacity={0.15}
				/>

				<Path
					path={indicatorPath}
					style="stroke"
					strokeWidth={INDICATOR_STROKE_WIDTH}
					strokeCap="butt"
					color={indicatorColor}
				/>
			</Group>
			<Circle cx={center} cy={center} r={centerCircleRadius} color={centerCircleColor} />
		</Canvas>
	);
}
