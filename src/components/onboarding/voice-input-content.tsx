import { ListGroup } from 'heroui-native';
import React from 'react';
import { Text, View } from 'react-native';

import { VoiceInputSetting } from '@/components/settings/voice-input-setting';

export function VoiceInputContent(): React.JSX.Element {
	return (
		<View className="flex-1 justify-center px-8 gap-8">
			<View>
				<Text className="text-3xl font-heading text-foreground mb-2">Voice Input</Text>
				<Text className="text-base text-muted mb-8">
					Requires a one-time download of the Whisper STT model. Completely optional, but
					makes writing a whole lot easier!
				</Text>
			</View>
			<ListGroup>
				<VoiceInputSetting />
			</ListGroup>
		</View>
	);
}
