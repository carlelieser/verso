import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Button } from 'heroui-native';
import React, { useCallback, useRef } from 'react';
import { View } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';

import { PortalSheet } from '@/components/ui/portal-sheet';
import { VoiceNote } from '@/components/voice-note/voice-note';
import type { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { useConfirmDialog } from '@/providers/dialog-provider';

interface VoiceNoteSheetProps {
	readonly sheet: ReturnType<typeof useBottomSheet>;
	readonly onAttach: (uri: string, name: string | null) => void;
}

export function VoiceNoteSheet({ sheet, onAttach }: VoiceNoteSheetProps): React.JSX.Element {
	const dialog = useConfirmDialog();
	const recorder = useVoiceRecorder();
	const { foreground, muted } = useThemeColors();
	const nameRef = useRef('');
	const inputRef = useRef<TextInput>(null);

	const resetName = useCallback(() => {
		nameRef.current = '';
		inputRef.current?.clear();
	}, []);

	const hasRecording = recorder.status === 'recorded';

	const handleClear = useCallback(async () => {
		const confirmed = await dialog.confirm({
			title: 'Clear Recording',
			description: 'Discard this recording and start over?',
			confirmLabel: 'Clear',
			variant: 'danger',
		});
		if (confirmed) {
			recorder.clear();
			resetName();
		}
	}, [dialog, recorder, resetName]);

	const handleDiscard = useCallback(async () => {
		if (recorder.status !== 'idle') {
			const confirmed = await dialog.confirm({
				title: 'Discard Voice Note',
				description: 'Your recording will be lost.',
				confirmLabel: 'Discard',
				variant: 'danger',
			});
			if (!confirmed) return;
		}
		recorder.clear();
		resetName();
		sheet.close();
	}, [dialog, recorder, resetName, sheet]);

	const handleAttach = useCallback(() => {
		if (!recorder.uri) return;
		const trimmed = nameRef.current.trim();
		onAttach(recorder.uri, trimmed.length > 0 ? trimmed : null);
		recorder.clear();
		resetName();
		sheet.close();
	}, [recorder, onAttach, resetName, sheet]);

	const footer = (
		<View className="flex-row gap-3">
			<Button variant="ghost" onPress={handleDiscard}>
				{recorder.status === 'idle' ? 'Close' : 'Discard'}
			</Button>
			<Button variant="primary" isDisabled={!hasRecording} onPress={handleAttach}>
				Attach
			</Button>
		</View>
	);

	return (
		<PortalSheet sheet={sheet} title="Voice note" footer={footer}>
			<VoiceNote
				mode="edit"
				isRecording={recorder.status === 'recording'}
				durationMs={recorder.durationMs}
				amplitudes={recorder.amplitudes}
				hasRecording={hasRecording}
				onRecord={recorder.record}
				onStop={recorder.stop}
				onClear={handleClear}
				elevation={1}
			/>
			<BottomSheetTextInput
				ref={inputRef}
				defaultValue=""
				onChangeText={(text) => {
					nameRef.current = text;
				}}
				placeholder="Name (optional)"
				placeholderTextColor={muted}
				className="bg-surface rounded-xl px-4 py-3 text-base border border-border"
				style={{ color: foreground }}
			/>
		</PortalSheet>
	);
}
