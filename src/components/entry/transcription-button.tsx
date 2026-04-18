import { Button } from 'heroui-native';
import { Mic } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Text, View } from 'react-native';
import type { EnrichedTextInputInstance } from 'react-native-enriched';
import type { SharedValue } from 'react-native-reanimated';

import { AudioWaveform } from '@/components/ui/audio-waveform';
import { useSettings } from '@/hooks/use-settings';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useWhisperTranscription } from '@/hooks/use-whisper-transcription';
import { appendHtmlParagraph } from '@/utils/html';

interface UseEditorTranscriptionOptions {
	readonly editorRef: React.RefObject<EnrichedTextInputInstance | null>;
}

interface UseEditorTranscriptionResult {
	readonly isEnabled: boolean;
	readonly isRecording: boolean;
	readonly isLoading: boolean;
	readonly liveText: string;
	readonly amplitudes: readonly SharedValue<number>[];
	readonly toggle: () => void;
}

export function useEditorTranscription({
	editorRef,
}: UseEditorTranscriptionOptions): UseEditorTranscriptionResult {
	const { isVoiceInputEnabled } = useSettings();

	const handleFinish = useCallback(
		async (text: string) => {
			if (!editorRef.current) return;
			const html = await editorRef.current.getHTML();
			editorRef.current.setValue(appendHtmlParagraph(html, text));
		},
		[editorRef],
	);

	const transcription = useWhisperTranscription(handleFinish);

	return {
		isEnabled: isVoiceInputEnabled,
		isRecording: transcription.isRecording,
		isLoading: transcription.status === 'loading',
		liveText: transcription.liveText,
		amplitudes: transcription.amplitudes,
		toggle: transcription.toggle,
	};
}

interface TranscriptionLiveTextProps {
	readonly transcription: UseEditorTranscriptionResult;
}

export function TranscriptionLiveText({
	transcription,
}: TranscriptionLiveTextProps): React.JSX.Element | null {
	if (
		!transcription.isEnabled ||
		transcription.liveText.length === 0 ||
		!transcription.isRecording
	) {
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
			{transcription.isRecording ? (
				<AudioWaveform amplitudes={transcription.amplitudes} color={accent} size={18} />
			) : (
				<Mic size={18} color={muted} />
			)}
		</Button>
	);
}
