import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, RADII, SPACING } from '@/constants/theme';
import type { Attachment } from '@/types/attachment';

interface AttachmentListProps {
  readonly attachments: readonly Attachment[];
  readonly onRemove: (id: string) => void;
}

const TYPE_ICONS: Record<string, string> = {
  photo: '🖼',
  voice_memo: '🎙',
  file: '📄',
  link: '🔗',
};

function getAttachmentLabel(attachment: Attachment): string {
  if (attachment.fileName) return attachment.fileName;
  if (attachment.type === 'link') return attachment.uri;
  if (attachment.type === 'photo') return 'Photo';
  if (attachment.type === 'voice_memo') return 'Voice Memo';
  return 'File';
}

export function AttachmentList({ attachments, onRemove }: AttachmentListProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <FlatList
        data={attachments}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.chip}>
            <Text style={styles.chipIcon}>{TYPE_ICONS[item.type] ?? '📎'}</Text>
            <Text style={styles.chipLabel} numberOfLines={1}>
              {getAttachmentLabel(item)}
            </Text>
            <Pressable
              style={styles.chipRemove}
              onPress={() => onRemove(item.id)}
              hitSlop={8}
            >
              <Text style={styles.chipRemoveText}>✕</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
  },
  list: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADII.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
    maxWidth: 200,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    flexShrink: 1,
  },
  chipRemove: {
    width: 20,
    height: 20,
    borderRadius: RADII.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRemoveText: {
    fontSize: 10,
    color: COLORS.text.tertiary,
  },
});
