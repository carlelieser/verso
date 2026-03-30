import React, { useMemo } from 'react';
import { EnrichedTextInput } from 'react-native-enriched';

import { buildHtmlStyle } from '@/constants/editor-styles';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface EntryViewerProps {
	readonly html: string;
}

/** Read-only rich text renderer using the same engine as the editor. */
export function EntryViewer({ html }: EntryViewerProps): React.JSX.Element {
	const { foreground, accent, muted, surface, editorFont } = useThemeColors();

	const htmlStyle = useMemo(
		() => buildHtmlStyle({ foreground, accent, muted, surface }),
		[foreground, accent, muted, surface],
	);

	const textStyle = useMemo(
		() => ({
			fontFamily: editorFont,
			color: foreground,
			lineHeight: 28,
			padding: 24,
			paddingTop: 0,
		}),
		[editorFont, foreground],
	);

	return (
		<EnrichedTextInput
			defaultValue={html}
			editable={false}
			scrollEnabled={false}
			style={textStyle}
			htmlStyle={htmlStyle}
		/>
	);
}
