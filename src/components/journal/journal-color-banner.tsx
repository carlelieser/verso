import React from 'react';
import { View } from 'react-native';

import { AutoSizedWave } from '@/components/ui/animated-wave';
import { hslToRgb, parseHex, rgbToHsl, toHex } from '@/utils/color';

interface JournalColorBannerProps {
	readonly color: string;
	readonly seed: string;
	readonly height?: number;
}

function seededRandom(seed: string, salt: number): number {
	let h = 0x9e3779b9 ^ salt;
	for (let i = 0; i < seed.length; i++) {
		h = Math.imul(h ^ seed.charCodeAt(i), 0x5bd1e995);
		h ^= h >>> 15;
	}
	h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
	h ^= h >>> 15;
	return (h >>> 0) / 0xffffffff;
}

function shiftLightness(hex: string, shift: number): string {
	const [r, g, b] = parseHex(hex);
	const [h, s, l] = rgbToHsl(r, g, b);
	const targetL = Math.max(0.05, Math.min(0.95, l + shift));
	const [nr, ng, nb] = hslToRgb(h, s, targetL);
	return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
}

function contrastingFill(hex: string): string {
	const [, , l] = rgbToHsl(...parseHex(hex));
	return shiftLightness(hex, l > 0.5 ? -0.35 : 0.4);
}

function midtoneFill(hex: string): string {
	const [, , l] = rgbToHsl(...parseHex(hex));
	return shiftLightness(hex, l > 0.5 ? -0.18 : 0.2);
}

export function JournalColorBanner({
	color,
	seed,
	height = 96,
}: JournalColorBannerProps): React.JSX.Element {
	const frontFill = contrastingFill(color);
	const backFill = midtoneFill(color);

	const maxPoints = 3 + Math.floor(seededRandom(seed, 2) * 4);
	const speed = 1 + seededRandom(seed, 3) * 3;
	const delta = height * (0.1 + seededRandom(seed, 4) * 0.6);
	const waveHeight = height * 0.3;
	const initialTick = seededRandom(seed, 1) * 800;

	const backMaxPoints = 3 + Math.floor(seededRandom(seed, 6) * 4);
	const backSpeed = 1 + seededRandom(seed, 7) * 3;
	const backDelta = height * (0.1 + seededRandom(seed, 8) * 0.6);
	const backWaveHeight = height * 0.15;
	const backInitialTick = seededRandom(seed, 9) * 800;

	return (
		<View style={{ height, backgroundColor: color, overflow: 'hidden' }}>
			<View style={{ position: 'absolute', inset: 0 }}>
				<AutoSizedWave
					height={height}
					fill={backFill}
					maxPoints={backMaxPoints}
					speed={backSpeed}
					delta={backDelta}
					waveHeight={backWaveHeight}
					initialTick={backInitialTick}
				/>
			</View>
			<View style={{ position: 'absolute', inset: 0 }}>
				<AutoSizedWave
					height={height}
					fill={frontFill}
					maxPoints={maxPoints}
					speed={speed}
					delta={delta}
					waveHeight={waveHeight}
					initialTick={initialTick}
				/>
			</View>
		</View>
	);
}
