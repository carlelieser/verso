import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { COLORS, RADII } from '@/constants/theme';
import { useTranscription } from '@/hooks/use-transcription';

interface DictationButtonProps {
  readonly onTranscribe: (text: string) => void;
}

export function DictationButton({ onTranscribe }: DictationButtonProps): React.JSX.Element {
  const { status, startRecording, stopRecording } = useTranscription();

  const isRecording = status === 'recording';
  const isLoading = status === 'loading_model';

  const handlePress = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording(onTranscribe);
    }
  }, [isRecording, startRecording, stopRecording, onTranscribe]);

  return (
    <Pressable
      style={[styles.button, isRecording && styles.buttonRecording]}
      onPress={handlePress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={COLORS.background} />
      ) : (
        <Text style={styles.icon}>{isRecording ? '⏹' : '🎤'}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: RADII.full,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRecording: {
    backgroundColor: COLORS.status.error,
  },
  icon: {
    fontSize: 20,
  },
});
