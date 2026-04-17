import {ListGroup} from 'heroui-native';
import React from 'react';
import {Text, View} from 'react-native';

import {VoiceInputSetting} from '@/components/settings/voice-input-setting';

export function VoiceInputContent(): React.JSX.Element {
	return (
		<View className="flex-1 justify-center px-8 gap-8">
			<View className="gap-2">
				<Text className="text-5xl font-heading text-foreground">Voice Input</Text>
				<Text className="text-lg text-muted">
					Requires a one-time download of the Whisper STT model. Completely optional, but makes writing a whole lot easier!
				</Text>
			</View>
			<ListGroup>
				<VoiceInputSetting/>
			</ListGroup>
		</View>
	);
}
