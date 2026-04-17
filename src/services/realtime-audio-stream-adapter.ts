import type { EventSubscription } from 'expo-modules-core';
import {
	AudioEncoding,
	type RealtimeAudioRecorder,
	RealtimeAudioRecorderModule,
} from 'react-native-realtime-audio';

import { decodeBase64ToBytes } from '@/utils/audio';

interface AudioStreamConfig {
	readonly sampleRate?: number;
	readonly channels?: number;
	readonly bitsPerSample?: number;
	readonly audioSource?: number;
	readonly bufferSize?: number;
}

interface AudioStreamData {
	readonly data: Uint8Array;
	readonly sampleRate: number;
	readonly channels: number;
	readonly timestamp: number;
}

interface AudioStreamInterface {
	initialize(config: AudioStreamConfig): Promise<void>;
	start(): Promise<void>;
	stop(): Promise<void>;
	isRecording(): boolean;
	onData(callback: (data: AudioStreamData) => void): void;
	onError(callback: (error: string) => void): void;
	onStatusChange(callback: (isRecording: boolean) => void): void;
	release(): Promise<void>;
}

/**
 * Implements whisper.rn's AudioStreamInterface using react-native-realtime-audio.
 * Drop-in replacement for AudioPcmStreamAdapter that uses a maintained Expo module
 * instead of the unmaintained @fugood/react-native-audio-pcm-stream.
 */
export class RealtimeAudioStreamAdapter implements AudioStreamInterface {
	private recorder: RealtimeAudioRecorder | null = null;
	private subscription: EventSubscription | null = null;
	private recording = false;
	private config: AudioStreamConfig | null = null;
	private dataCallback?: (data: AudioStreamData) => void;
	private errorCallback?: (error: string) => void;
	private statusCallback?: (isRecording: boolean) => void;

	async initialize(config: AudioStreamConfig): Promise<void> {
		if (this.recorder) {
			await this.release();
		}

		this.config = config;

		try {
			const RecorderClass = (RealtimeAudioRecorderModule as unknown as { RealtimeAudioRecorder: new (config: object, arg: boolean) => RealtimeAudioRecorder }).RealtimeAudioRecorder;
			this.recorder = new RecorderClass(
				{
					sampleRate: config.sampleRate ?? 16000,
					encoding: AudioEncoding.pcm16bitInteger,
					channelCount: config.channels ?? 1,
				},
				false,
			);

			this.subscription = RealtimeAudioRecorderModule.addListener(
				'onAudioCaptured',
				(event: { audioBuffer: string }) => {
					if (!this.dataCallback) return;

					try {
						const audioData = decodeBase64ToBytes(event.audioBuffer);
						this.dataCallback({
							data: audioData,
							sampleRate: this.config?.sampleRate ?? 16000,
							channels: this.config?.channels ?? 1,
							timestamp: Date.now(),
						});
					} catch (error: unknown) {
						const message =
							error instanceof Error ? error.message : 'Audio processing error';
						this.errorCallback?.(message);
					}
				},
			);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Unknown initialization error';
			this.errorCallback?.(message);
			throw new Error(`Failed to initialize RealtimeAudioRecorder: ${message}`);
		}
	}

	async start(): Promise<void> {
		if (!this.recorder) {
			throw new Error('AudioStream not initialized');
		}
		if (this.recording) return;

		try {
			await this.recorder.startRecording();
			this.recording = true;
			this.statusCallback?.(true);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Unknown start error';
			this.errorCallback?.(message);
			throw new Error(`Failed to start recording: ${message}`);
		}
	}

	async stop(): Promise<void> {
		if (!this.recording) return;

		try {
			await this.recorder?.stopRecording();
			this.recording = false;
			this.statusCallback?.(false);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Unknown stop error';
			this.errorCallback?.(message);
			throw new Error(`Failed to stop recording: ${message}`);
		}
	}

	isRecording(): boolean {
		return this.recording;
	}

	onData(callback: (data: AudioStreamData) => void): void {
		this.dataCallback = callback;
	}

	onError(callback: (error: string) => void): void {
		this.errorCallback = callback;
	}

	onStatusChange(callback: (isRecording: boolean) => void): void {
		this.statusCallback = callback;
	}

	async release(): Promise<void> {
		if (this.recording) {
			await this.stop();
		}

		this.subscription?.remove();
		this.subscription = null;
		this.recorder = null;
		this.config = null;
		this.dataCallback = undefined;
		this.errorCallback = undefined;
		this.statusCallback = undefined;
	}
}
