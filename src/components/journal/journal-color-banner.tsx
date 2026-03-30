import {
	Blur,
	Canvas,
	FractalNoise,
	Group,
	LinearGradient,
	Patch,
	Path,
	Rect,
	Shadow,
	Skia,
	vec,
} from '@shopify/react-native-skia';
import React, { useCallback, useMemo, useState } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';

import { hslToRgb, parseHex, rgbToHsl, toHex } from '@/utils/color';

interface JournalColorBannerProps {
	readonly color: string;
	readonly seed: string;
	readonly height?: number;
}

function seededRandom(seed: string, index: number): number {
	let h = 0x9e3779b9;
	const str = `${seed}-${index}`;
	for (let i = 0; i < str.length; i++) {
		h = Math.imul(h ^ str.charCodeAt(i), 0x5bd1e995);
		h ^= h >>> 15;
	}
	h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
	h ^= h >>> 15;
	return (h >>> 0) / 0xffffffff;
}

/**
 * Tonal variations of the base color for Coons patch corners.
 * Lightness is the primary driver; hue shifts are subtle.
 */
function generateCornerColors(hex: string, seed: string): [string, string, string, string] {
	const [r, g, b] = parseHex(hex);
	const [baseH, baseS, baseL] = rgbToHsl(r, g, b);

	const result: string[] = [];
	for (let i = 0; i < 4; i++) {
		const hueNudge = (seededRandom(seed, i + 40) - 0.5) * 0.16;
		const nh = (((baseH + hueNudge) % 1) + 1) % 1;

		const lightShift = (seededRandom(seed, i + 44) - 0.5) * 0.6;
		const nl = Math.max(0.15, Math.min(0.85, baseL + lightShift));

		// Desaturate lighter corners, enrich darker ones
		const satShift = nl < baseL ? 0.1 : -0.15;
		const ns = Math.max(0.1, Math.min(1, baseS + satShift));

		const [nr, ng, nb] = hslToRgb(nh, ns, nl);
		result.push(`#${toHex(nr)}${toHex(ng)}${toHex(nb)}`);
	}
	return result as [string, string, string, string];
}

interface PetalData {
	readonly path: ReturnType<typeof Skia.Path.Make>;
	readonly opacity: number;
	readonly base: { x: number; y: number };
	readonly tip: { x: number; y: number };
	readonly highlight: string;
	readonly body: string;
	readonly shadow: string;
	readonly dropShadowColor: string;
	readonly shadowDx: number;
	readonly shadowDy: number;
	readonly shadowBlur: number;
}

/**
 * Generate abstract petal shapes layered for depth.
 * Back petals are darker and more transparent, front petals are
 * lighter and more opaque — creating a sense of depth.
 */
function generatePetals(
	seed: string,
	hex: string,
	width: number,
	height: number,
): PetalData[] {
	const [r, g, b] = parseHex(hex);
	const [baseH, baseS, baseLightness] = rgbToHsl(r, g, b);
	const count = 6 + Math.floor(seededRandom(seed, 60) * 5);
	const petals: PetalData[] = [];

	for (let i = 0; i < count; i++) {
		const si = i * 10 + 70;
		const depth = i / (count - 1);
		const cx = seededRandom(seed, si) * width;
		const cy = seededRandom(seed, si + 1) * height;

		const angle = seededRandom(seed, si + 2) * Math.PI * 2;

		const petalLength = (0.6 + seededRandom(seed, si + 3) * 0.4) * Math.max(width, height);
		const petalWidth = (0.7 + seededRandom(seed, si + 4) * 0.4) * petalLength;

		const skew = (seededRandom(seed, si + 5) - 0.5) * petalWidth * 0.4;

		const cos = Math.cos(angle);
		const sin = Math.sin(angle);

		const rot = (x: number, y: number): { x: number; y: number } => ({
			x: cx + x * cos - y * sin,
			y: cy + x * sin + y * cos,
		});

		const pR = rot(petalLength * 0.45, petalWidth + skew);
		const pT = rot(petalLength, 0);
		const pL = rot(petalLength * 0.45, -petalWidth - skew);
		const pB = rot(0, 0);

		// Tangent-matched control handles for C1 continuity (winding: pB → pR → pT → pL → pB)
		const pB_out = rot(petalLength * 0.05, petalWidth * 0.6 + skew);
		const pR_in = rot(petalLength * 0.15, petalWidth * 1.1 + skew);
		const pR_out = rot(petalLength * 0.7, petalWidth * 0.8 + skew);
		const pT_inR = rot(petalLength * 0.9, petalWidth * 0.35);
		const pT_outL = rot(petalLength * 0.9, -petalWidth * 0.35);
		const pL_in = rot(petalLength * 0.7, -petalWidth * 0.8 - skew);
		const pL_out = rot(petalLength * 0.15, -petalWidth * 1.1 - skew);
		const pB_in = rot(petalLength * 0.05, -petalWidth * 0.6 - skew);

		const path = Skia.Path.Make();
		path.moveTo(pB.x, pB.y);
		path.cubicTo(pB_out.x, pB_out.y, pR_in.x, pR_in.y, pR.x, pR.y);
		path.cubicTo(pR_out.x, pR_out.y, pT_inR.x, pT_inR.y, pT.x, pT.y);
		path.cubicTo(pT_outL.x, pT_outL.y, pL_in.x, pL_in.y, pL.x, pL.y);
		path.cubicTo(pL_out.x, pL_out.y, pB_in.x, pB_in.y, pB.x, pB.y);

		const base = pB;
		const tip = pT;

		const hueNudge = (seededRandom(seed, si + 6) - 0.5) * 0.16;
		const nh = (((baseH + hueNudge) % 1) + 1) % 1;
		const ns = Math.max(0.1, Math.min(1, baseS + (depth < 0.5 ? 0.1 : -0.1)));

		const bodyL = Math.max(0.15, Math.min(0.85, baseLightness + (depth - 0.5) * 0.3));
		const highlightL = Math.min(0.9, bodyL + 0.2);
		const shadowL = Math.max(0.1, bodyL - 0.2);

		const hueWarm = (seededRandom(seed, si + 7) - 0.5) * 0.24;
		const hueCool = (seededRandom(seed, si + 8) - 0.5) * 0.24;

		const mkColor = (h: number, s: number, l: number): string => {
			const [cr, cg, cb] = hslToRgb(((h % 1) + 1) % 1, s, l);
			return `#${toHex(cr)}${toHex(cg)}${toHex(cb)}`;
		};

		petals.push({
			path,
			opacity: 0.15 + depth * 0.5,
			base,
			tip,
			highlight: mkColor(nh + hueWarm, Math.min(1, ns + 0.08), highlightL),
			body: mkColor(nh, ns, bodyL),
			shadow: mkColor(nh + hueCool, Math.max(0.1, ns - 0.05), shadowL),
			dropShadowColor: mkColor(nh, ns * 0.6, Math.max(0.05, bodyL - 0.3)),
			shadowDx: (seededRandom(seed, si + 9) - 0.5) * 8,
			shadowDy: 2 + seededRandom(seed, si + 10) * 8,
			shadowBlur: 12 + (1 - depth) * 20,
		});
	}

	return petals;
}

type PatchTuple = [
	{ pos: ReturnType<typeof vec>; c1: ReturnType<typeof vec>; c2: ReturnType<typeof vec> },
	{ pos: ReturnType<typeof vec>; c1: ReturnType<typeof vec>; c2: ReturnType<typeof vec> },
	{ pos: ReturnType<typeof vec>; c1: ReturnType<typeof vec>; c2: ReturnType<typeof vec> },
	{ pos: ReturnType<typeof vec>; c1: ReturnType<typeof vec>; c2: ReturnType<typeof vec> },
];

function buildPatch(seed: string, W: number, H: number): PatchTuple {
	const warpX = (idx: number): number => (seededRandom(seed, idx) - 0.5) * W * 1.2;
	const warpY = (idx: number): number => (seededRandom(seed, idx) - 0.5) * H * 1.6;

	return [
		{ pos: vec(0, 0), c1: vec(0, H / 3 + warpY(10)), c2: vec(W / 3 + warpX(11), 0) },
		{ pos: vec(W, 0), c1: vec((W * 2) / 3 + warpX(12), 0), c2: vec(W, H / 3 + warpY(13)) },
		{ pos: vec(W, H), c1: vec(W, (H * 2) / 3 + warpY(14)), c2: vec((W * 2) / 3 + warpX(15), H) },
		{ pos: vec(0, H), c1: vec(W / 3 + warpX(16), H), c2: vec(0, (H * 2) / 3 + warpY(17)) },
	];
}

export function JournalColorBanner({
	color,
	seed,
	height = 96,
}: JournalColorBannerProps): React.JSX.Element {
	const [width, setWidth] = useState(0);

	const handleLayout = useCallback((e: LayoutChangeEvent): void => {
		setWidth(e.nativeEvent.layout.width);
	}, []);

	const patch = useMemo(
		() => (width > 0 ? buildPatch(seed, width, height) : null),
		[seed, width, height],
	);
	const colors = useMemo(() => generateCornerColors(color, seed), [color, seed]);
	const petals = useMemo(
		() => (width > 0 ? generatePetals(seed, color, width, height) : []),
		[seed, color, width, height],
	);

	return (
		<View style={{ height }} onLayout={handleLayout}>
			{patch ? (
				<Canvas style={{ width, height }}>
					<Patch patch={patch} colors={colors} />
					{petals.map((petal, i) => (
						<Group key={i} opacity={petal.opacity}>
							<Shadow dx={petal.shadowDx} dy={petal.shadowDy} blur={petal.shadowBlur} color={petal.dropShadowColor} />
							<Blur blur={12} />
							<Path path={petal.path}>
								<LinearGradient
									start={vec(petal.base.x, petal.base.y)}
									end={vec(petal.tip.x, petal.tip.y)}
									colors={[petal.highlight, petal.body, petal.shadow]}
									positions={[0, 0.4, 1]}
								/>
							</Path>
						</Group>
					))}
					<Group blendMode="overlay" opacity={0.2}>
						<Rect x={0} y={0} width={width} height={height}>
							<FractalNoise freqX={0.9} freqY={0.9} octaves={4} />
						</Rect>
					</Group>
				</Canvas>
			) : null}
		</View>
	);
}
