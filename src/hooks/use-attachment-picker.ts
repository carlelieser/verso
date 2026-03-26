import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {useCallback, useEffect, useState} from 'react';
import {Alert} from 'react-native';

import {useDatabaseContext} from '@/providers/database-provider';
import {addFileAttachment, listAttachments} from '@/services/attachment-service';
import type {Attachment} from '@/types/attachment';
import type {FileData} from '@/types/attachment';

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

export function useAttachmentPicker(entryId: string | null): UseAttachmentPickerResult {
	const {db} = useDatabaseContext();
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
					const message = err instanceof Error ? err.message : 'Failed to add attachment';
					Alert.alert('Attachment Error', message);
				}
			}

			if (added.length > 0) {
				setAttachmentList((prev) => [...prev, ...added]);
			}
		},
		[db, entryId],
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

	const pickAudio = useCallback(async () => {
		const result = await DocumentPicker.getDocumentAsync({type: 'audio/*'});

		if (result.canceled) return;

		const files: PickedFile[] = result.assets.map((asset) => ({
			uri: asset.uri,
			mimeType: asset.mimeType ?? null,
			fileName: asset.name ?? null,
			sizeBytes: asset.size ?? null,
			type: 'audio' as const,
		}));

		await addFiles(files);
	}, [addFiles]);

	const pickDocuments = useCallback(async () => {
		const result = await DocumentPicker.getDocumentAsync({type: '*/*'});

		if (result.canceled) return;

		const files: PickedFile[] = result.assets.map((asset) => ({
			uri: asset.uri,
			mimeType: asset.mimeType ?? null,
			fileName: asset.name ?? null,
			sizeBytes: asset.size ?? null,
			type: 'document' as const,
		}));

		await addFiles(files);
	}, [addFiles]);

	return {attachments: attachmentList, pickImages, pickAudio, pickDocuments, refresh};
}
