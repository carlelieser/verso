const PCM_16BIT_MAX = 32768;

function base64ToBytes(base64: string): Uint8Array {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

/**
 * Decode a base64-encoded PCM 16-bit LE audio buffer into normalized sample values.
 * Returns numbers in [0, 1] representing absolute amplitude.
 */
export function decodeBase64Pcm16(base64: string): number[] {
	const bytes = base64ToBytes(base64);
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const sampleCount = Math.floor(bytes.byteLength / 2);
	const samples: number[] = [];

	for (let i = 0; i < sampleCount; i++) {
		const int16 = view.getInt16(i * 2, true);
		samples.push(Math.abs(int16) / PCM_16BIT_MAX);
	}

	return samples;
}

/**
 * Decode a base64-encoded PCM 16-bit LE audio buffer into raw bytes.
 * Used by the audio stream adapter for whisper.rn.
 */
export function decodeBase64ToBytes(base64: string): Uint8Array {
	return base64ToBytes(base64);
}
