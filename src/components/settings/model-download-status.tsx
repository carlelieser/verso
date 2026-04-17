import { Button } from 'heroui-native';
import { Check, CheckCircle, Download, RotateCcw, X } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

import type { UseModelDownloadResult } from '@/hooks/use-model-download';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface ModelDownloadStatusProps {
	readonly model: UseModelDownloadResult;
}

export function ModelDownloadStatus({ model }: ModelDownloadStatusProps): React.JSX.Element {
	const { muted, accent } = useThemeColors();
	const percent = Math.round(model.progress * 100);

	return (
		<View className="h-10 flex-row items-center justify-between">
			{model.status === 'downloaded' ? (
				<>
					<View className="flex-row items-center gap-2">
						<Check size={14} color={muted} />
						<Text className="text-xs text-muted">Ready</Text>
					</View>
					<View />
				</>
			) : model.status === 'downloading' ? (
				<>
					<View className="flex-1 gap-1 mr-2">
						<View className={'flex flex-row items-center justify-between'}>
							<Text className="text-xs text-muted">Downloading...</Text>
							<Text className="text-xs text-muted">{percent}%</Text>
						</View>
						<View className="h-1 bg-border rounded-full overflow-hidden">
							<View
								className="h-1 rounded-full bg-accent"
								style={{ width: `${percent}%` }}
							/>
						</View>
					</View>
					<Button variant="ghost" size="sm" isIconOnly onPress={model.cancel}>
						<X size={14} color={muted} />
					</Button>
				</>
			) : model.status === 'error' ? (
				<>
					<Text className="text-xs text-muted">Download failed</Text>
					<Button variant="ghost" size="sm" isIconOnly onPress={model.retry}>
						<RotateCcw size={14} color={muted} />
					</Button>
				</>
			) : (
				<>
					<Button className={'px-0'} variant="ghost" size="sm" onPress={model.download}>
						<Button.Label className="text-accent text-xs">Download</Button.Label>
					</Button>
					<Text className="text-xs text-muted">~77 MB</Text>
				</>
			)}
		</View>
	);
}
