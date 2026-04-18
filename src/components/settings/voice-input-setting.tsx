import { ControlField, ListGroup, Separator } from 'heroui-native';
import { Mic } from 'lucide-react-native';
import React, { useCallback } from 'react';

import { ModelDownloadStatus } from '@/components/settings/model-download-status';
import { SETTINGS_VOICE_INPUT_KEY, STT_MODEL_URL } from '@/constants/settings';
import { useModelDownload } from '@/hooks/use-model-download';
import { usePermissions } from '@/hooks/use-permissions';
import { useSettings } from '@/hooks/use-settings';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useConfirmDialog } from '@/providers/dialog-provider';
import { View } from 'react-native';

export function VoiceInputSetting(): React.JSX.Element {
	const { muted } = useThemeColors();
	const { isVoiceInputEnabled, setSetting } = useSettings();
	const { microphone: microphonePermission } = usePermissions();
	const dialog = useConfirmDialog();
	const model = useModelDownload();

	const handleToggle = useCallback(
		async (enabled: boolean) => {
			if (enabled && model.status !== 'downloaded') {
				const confirmed = await dialog.confirm({
					title: 'Download Model',
					description: `Voice input requires a one-time download of the Whisper STT (Speech-to-Text) model. This model is tiny (~77MB) and runs completely locally. No data leaves your device.`,
					confirmLabel: 'Download',
				});

				if (!confirmed) {
					return;
				}

				await model.download();
			}

			setSetting(SETTINGS_VOICE_INPUT_KEY, enabled);

			if (enabled && microphonePermission.status !== 'granted') {
				microphonePermission.action();
			}
		},
		[model, dialog, setSetting, microphonePermission],
	);

	return (
		<View>
			<ControlField isSelected={isVoiceInputEnabled} onSelectedChange={handleToggle}>
				<ListGroup.Item>
					<ListGroup.ItemPrefix>
						<Mic size={20} color={muted} />
					</ListGroup.ItemPrefix>
					<ListGroup.ItemContent>
						<ListGroup.ItemTitle>Voice input</ListGroup.ItemTitle>
						<ListGroup.ItemDescription>
							Use your voice to dictate entries
						</ListGroup.ItemDescription>
					</ListGroup.ItemContent>
					<ListGroup.ItemSuffix>
						<ControlField.Indicator />
					</ListGroup.ItemSuffix>
				</ListGroup.Item>
			</ControlField>
			<View className={'pl-12 pr-4 -mt-6'}>
				<ModelDownloadStatus model={model} />
			</View>
		</View>
	);
}
