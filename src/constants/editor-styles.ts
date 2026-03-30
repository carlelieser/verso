/**
 * Shared htmlStyle config for EnrichedTextInput.
 * Used by both the editor (editable) and the entry viewer (read-only).
 * Takes theme colors so it adapts to light/dark mode.
 */
export function buildHtmlStyle(colors: {
	readonly foreground: string;
	readonly accent: string;
	readonly muted: string;
	readonly surface: string;
}): Record<string, Record<string, unknown>> {
	return {
		h1: { fontSize: 28, bold: true },
		h2: { fontSize: 22, bold: true },
		blockquote: {
			borderColor: colors.accent,
			borderWidth: 3,
			gapWidth: 12,
			color: colors.muted,
		},
		codeblock: {
			backgroundColor: colors.surface,
			borderRadius: 8,
			color: colors.foreground,
		},
		code: {
			backgroundColor: colors.surface,
			color: colors.foreground,
		},
		ul: {
			bulletColor: colors.foreground,
		},
		ol: {
			markerColor: colors.foreground,
		},
		ulCheckbox: {
			boxColor: colors.muted,
		},
		a: {
			color: colors.accent,
			textDecorationLine: 'underline',
		},
	};
}
