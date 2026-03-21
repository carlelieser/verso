import { ChevronLeft, Pencil } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import { Button } from 'heroui-native';

import { EMOTION_LABELS } from '@/constants/emotions';
import { useEntries } from '@/hooks/use-entries';
import type { EntryWithEmotions } from '@/services/entry-service';
import type { EmotionCategory } from '@/types/common';
import { formatRelativeDate } from '@/utils/date';

export default function EntryViewScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [muted, accentForeground, accent] = useCSSVariable([
    '--color-muted',
    '--color-accent-foreground',
    '--color-accent',
  ]);
  const { loadEntry } = useEntries();
  const [entry, setEntry] = useState<EntryWithEmotions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadEntry(id).then((result) => {
        setEntry(result);
        setIsLoading(false);
      });
    }
  }, [id, loadEntry]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted">Loading...</Text>
      </View>
    );
  }

  if (!entry) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted">Entry not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="p-3">
        <Button variant="ghost" size="sm" isIconOnly onPress={() => router.back()}>
          <ChevronLeft size={20} color={muted as string} />
        </Button>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 80,
        }}
      >
        <Text className="text-xs text-muted mb-4">
          {formatRelativeDate(entry.createdAt)}
        </Text>

        <Text
          className="font-editor text-foreground"
          style={{ fontSize: 17, lineHeight: 28 }}
        >
          {entry.contentText}
        </Text>

        {entry.emotions.length > 0 ? (
          <View style={{ marginTop: 24, gap: 8 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '500',
                letterSpacing: 3,
                color: muted as string,
              }}
            >
              EMOTIONS
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {entry.emotions.map((emotion) => (
                <View
                  key={emotion.id}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: accent as string,
                  }}
                >
                  <Text style={{ fontSize: 13, color: accent as string }}>
                    {EMOTION_LABELS[emotion.category as EmotionCategory]} · {emotion.intensity}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Edit FAB */}
      <Button
        variant="primary"
        size="lg"
        isIconOnly
        onPress={() => router.push(`/entry/${id}/edit`)}
        className="absolute bottom-8 right-5 w-14 h-14 rounded-full shadow-2xl"
        style={{ bottom: insets.bottom + 16 }}
      >
        <Pencil size={20} color={accentForeground as string} />
      </Button>
    </View>
  );
}
