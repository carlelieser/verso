import React from 'react';
import { Image, Text, View } from 'react-native';

import type { FileAttachment } from '@/types/attachment';

interface FilePreviewProps {
	readonly attachment: FileAttachment;
}

function getExtension(attachment: FileAttachment): string {
	const source = attachment.data.fileName ?? attachment.data.uri;
	const match = /\.([^./\\?#]+)(?:[?#].*)?$/.exec(source);
	return match?.[1]?.toUpperCase() ?? 'FILE';
}

export function FilePreview({ attachment }: FilePreviewProps): React.JSX.Element | null {
	if (attachment.type === 'image') {
		return (
			<View className="rounded-xl overflow-hidden bg-surface-secondary">
				<Image
					source={{ uri: attachment.data.uri }}
					style={{ width: '100%', aspectRatio: 4 / 3 }}
					resizeMode="cover"
				/>
			</View>
		);
	}

	if (attachment.type === 'document') {
		return (
			<View className="rounded-xl bg-secondary items-center justify-center py-8">
				<Text className="font-heading text-4xl text-foreground">
					{getExtension(attachment)}
				</Text>
			</View>
		);
	}

	return null;
}
