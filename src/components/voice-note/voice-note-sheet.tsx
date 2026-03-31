import { Button, Input, Label } from 'heroui-native';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';

import { PortalSheet } from '@/components/ui/portal-sheet';
import { VoiceNote } from '@/components/voice-note/voice-note';
import type { useBottomSheet } from '@/hooks/use-bottom-sheet';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { useConfirmDialog } from '@/providers/dialog-provider';

interface VoiceNoteSheetProps {
	readonly sheet: ReturnType<typeof useBottomSheet>;
	readonly onAttach: (uri: string, name: string | null) => void;
}

export function VoiceNoteSheet({ sheet, onAttach }: VoiceNoteSheetProps): React.JSX.Element {
	const dialog = useConfirmDialog();
	const recorder = useVoiceRecorder();
	const [name, setName] = useState('');

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
			setName('');
		}
	}, [dialog, recorder]);

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
		setName('');
		sheet.close();
	}, [dialog, hasRecording, recorder, sheet]);

	const handleAttach = useCallback(() => {
		if (!recorder.uri) return;
		onAttach(recorder.uri, name.trim().length > 0 ? name.trim() : null);
		recorder.clear();
		setName('');
		sheet.close();
	}, [recorder, name, onAttach, sheet]);

	const footer = (
		<View className="flex-row gap-3">
			<Button variant="ghost" onPress={handleDiscard}>
				Discard
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
				amplitude={recorder.amplitude}
				hasRecording={hasRecording}
				onRecord={recorder.record}
				onStop={recorder.stop}
				onClear={handleClear}
			/>
			<View className="gap-2">
				<Label>Name (optional)</Label>
				<Input value={name} onChangeText={setName} placeholder="Untitled voice note" />
			</View>
		</PortalSheet>
	);
}
