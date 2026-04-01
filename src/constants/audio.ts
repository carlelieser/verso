export const WAVEFORM_BAR_COUNT = 4;

/**
 * Compute mean absolute amplitude per bar from a frame of audio samples.
 * Splits `frames` into `WAVEFORM_BAR_COUNT` equal chunks and returns the
 * average |sample| for each, divided by `normalizer`.
 */
export function computeBarAmplitudes(frames: readonly number[], normalizer: number = 1): number[] {
	const chunkSize = Math.floor(frames.length / WAVEFORM_BAR_COUNT);
	const result: number[] = [];
	for (let i = 0; i < WAVEFORM_BAR_COUNT; i++) {
		const start = i * chunkSize;
		const end = i === WAVEFORM_BAR_COUNT - 1 ? frames.length : start + chunkSize;
		let sum = 0;
		for (let j = start; j < end; j++) {
			sum += Math.abs(frames[j]!);
		}
		result.push(sum / (end - start) / normalizer);
	}
	return result;
}
