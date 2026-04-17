import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useEffect, useRef, useState } from 'react';

import { STT_MODEL_FILENAME, STT_MODEL_URL } from '@/constants/settings';

export type ModelDownloadStatus = 'not-downloaded' | 'downloading' | 'downloaded' | 'error';

const MODEL_DIR = `${FileSystem.documentDirectory}models/`;
const MODEL_PATH = `${MODEL_DIR}${STT_MODEL_FILENAME}`;

export interface UseModelDownloadResult {
	readonly status: ModelDownloadStatus;
	readonly progress: number;
	readonly modelPath: string;
	readonly download: () => Promise<void>;
	readonly cancel: () => void;
	readonly retry: () => Promise<void>;
}

export function useModelDownload(): UseModelDownloadResult {
	const [status, setStatus] = useState<ModelDownloadStatus>('not-downloaded');
	const [progress, setProgress] = useState(0);
	const downloadRef = useRef<FileSystem.DownloadResumable | null>(null);

	useEffect(() => {
		FileSystem.getInfoAsync(MODEL_PATH)
			.then((info) => {
				if (info.exists) setStatus('downloaded');
			})
			.catch(() => {});
	}, []);

	const cancel = useCallback(() => {
		downloadRef.current?.cancelAsync().catch(() => {});
		downloadRef.current = null;
		setStatus('not-downloaded');
		setProgress(0);
	}, []);

	const download = useCallback(async () => {
		try {
			setStatus('downloading');
			setProgress(0);

			const dirInfo = await FileSystem.getInfoAsync(MODEL_DIR);
			if (!dirInfo.exists) {
				await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
			}

			const resumable = FileSystem.createDownloadResumable(
				STT_MODEL_URL,
				MODEL_PATH,
				{},
				(downloadProgress) => {
					const ratio =
						downloadProgress.totalBytesExpectedToWrite > 0
							? downloadProgress.totalBytesWritten /
							  downloadProgress.totalBytesExpectedToWrite
							: 0;
					setProgress(ratio);
				},
			);

			downloadRef.current = resumable;
			const result = await resumable.downloadAsync();
			downloadRef.current = null;

			if (result?.uri) {
				setStatus('downloaded');
				setProgress(1);
			} else {
				setStatus('error');
			}
		} catch (err: unknown) {
			console.error('Model download failed:', err);
			if (downloadRef.current !== null) {
				setStatus('error');
			}
			downloadRef.current = null;
		}
	}, []);

	const retry = useCallback(async () => {
		cancel();
		await download();
	}, [cancel, download]);

	return { status, progress, modelPath: MODEL_PATH, download, cancel, retry };
}
