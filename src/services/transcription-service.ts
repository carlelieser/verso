import { Paths, File } from 'expo-file-system';

import { TranscriptionError } from '@/errors/domain-errors';
import type { TranscriptionStatus } from '@/types/common';

const MODEL_FILENAME = 'ggml-tiny.en.bin';
const MODEL_URL = `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${MODEL_FILENAME}`;

interface TranscriptionCallbacks {
  readonly onTranscribe: (text: string) => void;
  readonly onStatusChange: (status: TranscriptionStatus) => void;
  readonly onError: (error: Error) => void;
}

export function createTranscriptionService(): {
  initialize: () => Promise<void>;
  start: (callbacks: TranscriptionCallbacks) => Promise<void>;
  stop: () => Promise<string>;
  isModelDownloaded: () => boolean;
  downloadModel: (onProgress: (progress: number) => void) => Promise<void>;
} {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let whisperContext: any = null;
  let isRecording = false;
  let currentTranscription = '';

  function getModelPath(): string {
    return `${Paths.document.uri}${MODEL_FILENAME}`;
  }

  return {
    isModelDownloaded(): boolean {
      const modelFile = new File(getModelPath());
      return modelFile.exists;
    },

    async downloadModel(onProgress): Promise<void> {
      const modelPath = getModelPath();
      const modelFile = new File(modelPath);

      const response = await fetch(MODEL_URL);
      if (!response.ok || !response.body) {
        throw new TranscriptionError('Failed to download Whisper model');
      }

      const reader = response.body.getReader();
      const contentLength = Number(response.headers.get('content-length') ?? 0);
      let receivedLength = 0;
      const chunks: ArrayBuffer[] = [];

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value.buffer as ArrayBuffer);
        receivedLength += value.length;
        if (contentLength > 0) {
          onProgress(receivedLength / contentLength);
        }
      }

      const blob = new Blob(chunks);
      const arrayBuffer = await blob.arrayBuffer();
      modelFile.create();
      modelFile.write(new Uint8Array(arrayBuffer));
    },

    async initialize(): Promise<void> {
      try {
        const whisperModule = require('whisper.rn');
        const modelPath = getModelPath();

        if (!new File(modelPath).exists) {
          throw new TranscriptionError('Whisper model not downloaded. Call downloadModel first.');
        }

        whisperContext = await whisperModule.initWhisper({ filePath: modelPath });
      } catch (error: unknown) {
        throw new TranscriptionError('Failed to initialize Whisper', { cause: error });
      }
    },

    async start(callbacks): Promise<void> {
      if (!whisperContext) {
        throw new TranscriptionError('Whisper not initialized. Call initialize first.');
      }

      if (isRecording) {
        return;
      }

      isRecording = true;
      currentTranscription = '';
      callbacks.onStatusChange('recording');

      try {
        await whisperContext.transcribeRealtime({
          maxLen: 0,
          language: 'en',
          onTranscribe: (result: { text: string }) => {
            currentTranscription += result.text;
            callbacks.onTranscribe(result.text);
          },
        });
      } catch (error: unknown) {
        isRecording = false;
        callbacks.onStatusChange('error');
        callbacks.onError(
          error instanceof Error ? error : new TranscriptionError(String(error)),
        );
      }
    },

    async stop(): Promise<string> {
      isRecording = false;
      return currentTranscription;
    },
  };
}
