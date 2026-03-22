import { ChevronLeft, Pencil } from 'lucide-react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from 'heroui-native';

import { EMOTION_LABELS } from '@/constants/emotions';
import { useEntries } from '@/hooks/use-entries';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { EntryWithEmotions } from '@/types/entry';
import { formatRelativeDate } from '@/utils/date';

export default function EntryViewScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { muted, accentForeground, accent } = useThemeColors();
  const { loadEntry } = useEntries();
  const [entry, setEntry] = useState<EntryWithEmotions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      if (id) {
        loadEntry(id)
          .then((result) => {
            if (isActive) {
              setEntry(result);
              setIsLoading(false);
            }
          })
          .catch(() => {
            if (isActive) {
              setEntry(null);
              setIsLoading(false);
            }
          });
      }

      return () => {
        isActive = false;
      };
    }, [id, loadEntry]),
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {isLoading || !entry ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">
            {isLoading ? 'Loading...' : 'Entry not found'}
          </Text>
        </View>
      ) : (
        <>
          <View className="p-3">
            <Button variant="ghost" size="sm" isIconOnly onPress={() => router.back()}>
              <ChevronLeft size={20} color={muted} />
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
                    color: muted,
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
                        borderColor: accent,
                      }}
                    >
                      <Text style={{ fontSize: 13, color: accent }}>
                        {EMOTION_LABELS[emotion.category]} · {emotion.intensity}
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
            <Pencil size={20} color={accentForeground} />
          </Button>
        </>
      )}
    </View>
  );
}
