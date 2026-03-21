import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import { captureRef } from 'react-native-view-shot';

/**
 * Captures a React Native view as a PNG image.
 *
 * @param viewRef - A ref to the view to capture
 * @returns The local URI of the generated image
 */
export async function exportInsightAsImage(viewRef: RefObject<unknown>): Promise<string> {
  const uri = await captureRef(viewRef, { format: 'png', quality: 0.9 });
  return uri;
}

/**
 * Captures a React Native view and converts it to a PDF.
 *
 * @param viewRef - A ref to the view to capture
 * @returns The local URI of the generated PDF
 */
export async function exportInsightAsPdf(viewRef: RefObject<unknown>): Promise<string> {
  const imageUri = await captureRef(viewRef, { format: 'png', quality: 0.9 });
  const html = `<html><body style="margin:0;padding:0;"><img src="${imageUri}" style="width:100%;" /></body></html>`;
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

/**
 * Shares a file using the system share sheet.
 *
 * @param uri - The local URI of the file to share
 * @throws Error when sharing is not available on the device
 */
export async function shareInsight(uri: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }
  await Sharing.shareAsync(uri);
}
