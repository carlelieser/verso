import { useCallback, useRef, useState } from 'react';

import { createTranscriptionService } from '@/services/transcription-service';
import type { TranscriptionStatus } from '@/types/common';

interface UseTranscriptionResult {
  readonly status: TranscriptionStatus;
  readonly isModelDownloaded: boolean;
  readonly downloadProgress: number;
  readonly lastTranscription: string;
  readonly downloadModel: () => Promise<void>;
  readonly startRecording: (onTranscribe: (text: string) => void) => Promise<void>;
  readonly stopRecording: () => Promise<string>;
}

export function useTranscription(): UseTranscriptionResult {
  const serviceRef = useRef(createTranscriptionService());
  const [status, setStatus] = useState<TranscriptionStatus>('idle');
  const [isModelDownloaded, setIsModelDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [lastTranscription, setLastTranscription] = useState('');

  const downloadModel = useCallback(async () => {
    const service = serviceRef.current;
    const isDownloaded = await service.isModelDownloaded();

    if (isDownloaded) {
      setIsModelDownloaded(true);
      return;
    }

    setStatus('loading_model');
    await service.downloadModel((progress) => setDownloadProgress(progress));
    setIsModelDownloaded(true);
    setStatus('idle');
  }, []);

  const startRecording = useCallback(async (onTranscribe: (text: string) => void) => {
    const service = serviceRef.current;

    if (!isModelDownloaded) {
      await downloadModel();
    }

    await service.initialize();
    await service.start({
      onTranscribe: (text) => {
        setLastTranscription(text);
        onTranscribe(text);
      },
      onStatusChange: setStatus,
      onError: () => setStatus('error'),
    });
  }, [isModelDownloaded, downloadModel]);

  const stopRecording = useCallback(async (): Promise<string> => {
    const service = serviceRef.current;
    const text = await service.stop();
    setStatus('idle');
    return text;
  }, []);

  return {
    status,
    isModelDownloaded,
    downloadProgress,
    lastTranscription,
    downloadModel,
    startRecording,
    stopRecording,
  };
}
