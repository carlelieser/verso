/**
 * Type declarations for whisper.rn
 *
 * The package's exports map is incomplete (no root "." entry, and subpath
 * imports via "src/" double-nest under the "./*" wildcard). These declarations
 * bridge the gap so TypeScript resolves the imports the Metro bundler uses.
 */

declare module 'whisper.rn' {
	export interface TranscribeOptions {
		language?: string;
		maxLen?: number;
		translate?: boolean;
		beam_size?: number;
		best_of?: number;
		speed_up?: boolean;
		temperature?: number;
		temperature_inc?: number;
		prompt?: string;
		tdrzEnable?: boolean;
		maxContext?: number;
		offset?: number;
		duration?: number;
		wordThold?: number;
		entropyThold?: number;
		logprobThold?: number;
		noSpeechThold?: number;
		nThreads?: number;
	}

	export interface TranscribeResultSegment {
		text: string;
		t0: number;
		t1: number;
	}

	export interface TranscribeResult {
		result: string;
		segments: TranscribeResultSegment[];
	}

	export interface VadOptions {
		threshold?: number;
		minSpeechDurationMs?: number;
		minSilenceDurationMs?: number;
		maxSpeechDurationS?: number;
		speechPadMs?: number;
		samplesOverlap?: number;
	}

	export interface WhisperContext {
		id: number;
		transcribeData: (
			data: ArrayBuffer,
			options: TranscribeOptions,
		) => {
			stop: () => Promise<void>;
			promise: Promise<TranscribeResult>;
		};
		release: () => Promise<void>;
	}

	export function initWhisper(options: {
		filePath: string | number;
		isBundleAsset?: boolean;
		downloadFileUrl?: string;
		cacheDir?: string;
		useGpu?: boolean;
		useCoreMLIos?: boolean;
		useFlashAttn?: boolean;
	}): Promise<WhisperContext>;
}

declare module 'whisper.rn/src/realtime-transcription' {
	import type { WhisperContext, TranscribeOptions } from 'whisper.rn';

	export interface AudioStreamData {
		data: Uint8Array;
		sampleRate: number;
		channels: number;
		timestamp: number;
	}

	export interface AudioStreamInterface {
		initialize(config: unknown): Promise<void>;
		start(): Promise<void>;
		stop(): Promise<void>;
		isRecording(): boolean;
		onData(callback: (data: AudioStreamData) => void): void;
		onError(callback: (error: string) => void): void;
		onStatusChange(callback: (isRecording: boolean) => void): void;
		release(): Promise<void>;
	}

	export interface RealtimeTranscribeEvent {
		type: 'start' | 'transcribe' | 'end' | 'error';
		sliceIndex: number;
		data?: {
			result: string;
			segments: Array<{ text: string; t0: number; t1: number }>;
		};
		isCapturing: boolean;
		processTime: number;
		recordingTime: number;
	}

	export interface RealtimeTranscriberCallbacks {
		onTranscribe?: (event: RealtimeTranscribeEvent) => void;
		onError?: (error: string) => void;
		onStatusChange?: (isActive: boolean) => void;
	}

	export interface RealtimeOptions {
		audioSliceSec?: number;
		audioMinSec?: number;
		transcribeOptions?: TranscribeOptions;
	}

	export interface RealtimeTranscriberDependencies {
		whisperContext: WhisperContext;
		audioStream: AudioStreamInterface;
	}

	export class RealtimeTranscriber {
		constructor(
			deps: RealtimeTranscriberDependencies,
			options: RealtimeOptions,
			callbacks: RealtimeTranscriberCallbacks,
		);
		start(): Promise<void>;
		stop(): Promise<void>;
		release(): void;
	}
}
