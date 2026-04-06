/** Parse a 6-char hex color to normalized RGB (0–1). */
export function parseHex(hex: string): [number, number, number] {
	const clean = hex.replace('#', '');
	return [
		parseInt(clean.substring(0, 2), 16) / 255,
		parseInt(clean.substring(2, 4), 16) / 255,
		parseInt(clean.substring(4, 6), 16) / 255,
	];
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	if (max === min) return [0, 0, l];
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h = 0;
	if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
	else if (max === g) h = ((b - r) / d + 2) / 6;
	else h = ((r - g) / d + 4) / 6;
	return [h, s, l];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
	if (s === 0) return [l, l, l];
	const hue2rgb = (p: number, q: number, t: number): number => {
		const tt = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
		if (tt < 1 / 6) return p + (q - p) * 6 * tt;
		if (tt < 1 / 2) return q;
		if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
		return p;
	};
	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}

/** Returns true when the given hex color is perceptually light. */
export function isLightColor(hex: string): boolean {
	const [r, g, b] = parseHex(hex);
	const [, , lightness] = rgbToHsl(r, g, b);
	return lightness > 0.55;
}

/** Convert a normalized 0–1 channel value to a 2-char hex string. */
export function toHex(n: number): string {
	return Math.max(0, Math.min(255, Math.round(n * 255)))
		.toString(16)
		.padStart(2, '0');
}
