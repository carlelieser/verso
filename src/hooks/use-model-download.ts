import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { unzip } from 'react-native-zip-archive';

import {
	STT_COREML_ENCODER_SIZE_BYTES,
	STT_COREML_ENCODER_URL,
	STT_COREML_ENCODER_ZIP_FILENAME,
	STT_MODEL_FILENAME,
	STT_MODEL_SIZE_BYTES,
	STT_MODEL_URL,
} from '@/constants/settings';
import { log } from '@/utils/log';

export type ModelDownloadStatus = 'not-downloaded' | 'downloading' | 'downloaded' | 'error';

const MODEL_DIR = `${FileSystem.documentDirectory}models/`;
const MODEL_PATH = `${MODEL_DIR}${STT_MODEL_FILENAME}`;

const BIN_WEIGHT = STT_MODEL_SIZE_BYTES / (STT_MODEL_SIZE_BYTES + STT_COREML_ENCODER_SIZE_BYTES);
const COREML_WEIGHT = 1 - BIN_WEIGHT;

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

			const needsCoreML = Platform.OS === 'ios';
			const binWeight = needsCoreML ? BIN_WEIGHT : 1;
			const coreMLWeight = needsCoreML ? COREML_WEIGHT : 0;

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
					setProgress(ratio * binWeight);
				},
			);

			downloadRef.current = resumable;
			const result = await resumable.downloadAsync();
			downloadRef.current = null;

			if (!result?.uri) {
				setStatus('error');
				return;
			}

			setProgress(binWeight);

			if (needsCoreML) {
				const zipPath = `${MODEL_DIR}${STT_COREML_ENCODER_ZIP_FILENAME}`;
				const encoderResumable = FileSystem.createDownloadResumable(
					STT_COREML_ENCODER_URL,
					zipPath,
					{},
					(downloadProgress) => {
						const ratio =
							downloadProgress.totalBytesExpectedToWrite > 0
								? downloadProgress.totalBytesWritten /
								  downloadProgress.totalBytesExpectedToWrite
								: 0;
						setProgress(binWeight + ratio * coreMLWeight);
					},
				);
				downloadRef.current = encoderResumable;
				const encoderResult = await encoderResumable.downloadAsync();
				downloadRef.current = null;

				if (!encoderResult?.uri) {
					setStatus('error');
					return;
				}

				await unzip(encoderResult.uri, MODEL_DIR);
				await FileSystem.deleteAsync(encoderResult.uri, { idempotent: true });
			}

			setStatus('downloaded');
			setProgress(1);
		} catch (err: unknown) {
			log.error('model-download', 'Model download failed', err);
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
