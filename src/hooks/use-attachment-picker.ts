import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';

import { useDatabaseContext } from '@/providers/database-provider';
import { getErrorMessage } from '@/utils/error';
import { addFileAttachment, listAttachments } from '@/services/attachment-service';
import type { Attachment } from '@/types/attachment';

interface UseAttachmentPickerOptions {
	readonly onError?: (title: string, message: string) => void;
}

interface UseAttachmentPickerResult {
	readonly attachments: readonly Attachment[];
	readonly pickImages: () => Promise<void>;
	readonly pickAudio: () => Promise<void>;
	readonly pickDocuments: () => Promise<void>;
	readonly refresh: () => Promise<void>;
}

interface PickedFile {
	readonly uri: string;
	readonly mimeType: string | null;
	readonly fileName: string | null;
	readonly sizeBytes: number | null;
	readonly type: 'image' | 'audio' | 'document';
}

export function useAttachmentPicker(
	entryId: string | null,
	options?: UseAttachmentPickerOptions,
): UseAttachmentPickerResult {
	const { db } = useDatabaseContext();
	const onError = options?.onError;
	const [attachmentList, setAttachmentList] = useState<readonly Attachment[]>([]);

	const refresh = useCallback(async () => {
		if (!entryId) {
			setAttachmentList([]);
			return;
		}
		const results = await listAttachments(db, entryId);
		setAttachmentList(results);
	}, [db, entryId]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const addFiles = useCallback(
		async (files: readonly PickedFile[]) => {
			if (!entryId || files.length === 0) return;

			const added: Attachment[] = [];
			for (const file of files) {
				try {
					const attachment = await addFileAttachment(db, {
						entryId,
						type: file.type,
						sourceUri: file.uri,
						mimeType: file.mimeType,
						fileName: file.fileName,
						sizeBytes: file.sizeBytes,
					});
					added.push(attachment);
				} catch (err: unknown) {
					const message = getErrorMessage(err, 'Failed to add attachment');
					onError?.('Attachment Error', message);
				}
			}

			if (added.length > 0) {
				setAttachmentList((prev) => [...prev, ...added]);
			}
		},
		[db, entryId, onError],
	);

	const pickDocumentFiles = useCallback(
		async (mimeType: string, fileType: PickedFile['type']) => {
			const result = await DocumentPicker.getDocumentAsync({ type: mimeType });
			if (result.canceled) return;

			const files: PickedFile[] = result.assets.map((asset) => ({
				uri: asset.uri,
				mimeType: asset.mimeType ?? null,
				fileName: asset.name ?? null,
				sizeBytes: asset.size ?? null,
				type: fileType,
			}));

			await addFiles(files);
		},
		[addFiles],
	);

	const pickImages = useCallback(async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			allowsMultipleSelection: true,
			mediaTypes: ['images'],
		});

		if (result.canceled) return;

		const files: PickedFile[] = result.assets.map((asset) => ({
			uri: asset.uri,
			mimeType: asset.mimeType ?? null,
			fileName: asset.fileName ?? null,
			sizeBytes: asset.fileSize ?? null,
			type: 'image' as const,
		}));

		await addFiles(files);
	}, [addFiles]);

	const pickAudio = useCallback(() => pickDocumentFiles('audio/*', 'audio'), [pickDocumentFiles]);

	const pickDocuments = useCallback(() => pickDocumentFiles('*/*', 'document'), [pickDocumentFiles]);

	return { attachments: attachmentList, pickImages, pickAudio, pickDocuments, refresh };
}
