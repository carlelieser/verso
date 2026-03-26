import { Button } from 'heroui-native';
import { Mic } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Text, View } from 'react-native';
import type { EnrichedTextInputInstance } from 'react-native-enriched';

import { useSettings } from '@/hooks/use-settings';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useWhisperTranscription } from '@/hooks/use-whisper-transcription';

interface UseEditorTranscriptionOptions {
	readonly editorRef: React.RefObject<EnrichedTextInputInstance | null>;
}

interface UseEditorTranscriptionResult {
	readonly isEnabled: boolean;
	readonly isRecording: boolean;
	readonly isLoading: boolean;
	readonly liveText: string;
	readonly toggle: () => void;
}

export function useEditorTranscription({
	editorRef,
}: UseEditorTranscriptionOptions): UseEditorTranscriptionResult {
	const { isTranscriptionEnabled } = useSettings();

	const handleFinish = useCallback(
		async (text: string) => {
			if (!editorRef.current) return;
			const html = await editorRef.current.getHTML();
			const escaped = text
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;');
			editorRef.current.setValue(
				html.replace(/<\/html>\s*$/, `<p>${escaped}</p>\n</html>`),
			);
		},
		[editorRef],
	);

	const transcription = useWhisperTranscription(handleFinish);

	return {
		isEnabled: isTranscriptionEnabled,
		isRecording: transcription.isRecording,
		isLoading: transcription.status === 'loading',
		liveText: transcription.liveText,
		toggle: transcription.toggle,
	};
}

interface TranscriptionLiveTextProps {
	readonly transcription: UseEditorTranscriptionResult;
}

export function TranscriptionLiveText({
	transcription,
}: TranscriptionLiveTextProps): React.JSX.Element | null {
	if (!transcription.isEnabled || transcription.liveText.length === 0 || !transcription.isRecording) {
		return null;
	}

	return (
		<View className="bg-background px-6 py-2">
			<Text className="text-sm text-muted italic">{transcription.liveText}</Text>
		</View>
	);
}

interface TranscriptionButtonProps {
	readonly transcription: UseEditorTranscriptionResult;
}

export function TranscriptionButton({
	transcription,
}: TranscriptionButtonProps): React.JSX.Element | null {
	const { accent, muted } = useThemeColors();

	if (!transcription.isEnabled) return null;

	return (
		<Button
			variant="ghost"
			isIconOnly
			isDisabled={transcription.isLoading}
			onPress={transcription.toggle}
		>
			<Mic size={18} color={transcription.isRecording ? accent : muted} />
		</Button>
	);
}
