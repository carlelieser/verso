declare module 'whisper.rn' {
  interface WhisperContext {
    transcribeRealtime(options: {
      maxLen: number;
      language: string;
      onTranscribe: (result: { text: string }) => void;
    }): Promise<{ stop: () => Promise<void> }>;
  }

  function initWhisper(options: { filePath: string }): Promise<WhisperContext>;
}
