import { Check, ChevronLeft, SmilePlus } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { Button } from 'heroui-native';

import { Editor, type EditorHandle } from '@/components/editor';
import { EmotionCheckin } from '@/components/emotion-checkin';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useEmotions } from '@/hooks/use-emotions';
import { useEntries } from '@/hooks/use-entries';
import type { EmotionCategory, EmotionIntensity } from '@/types/common';

export default function EntryEditScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [muted, surface, accentForeground] = useCSSVariable([
    '--color-muted',
    '--color-surface',
    '--color-accent-foreground',
  ]);

  const { loadEntry, updateEntry } = useEntries();
  const { saveEmotions, getEmotions } = useEmotions();

  const [isLoading, setIsLoading] = useState(true);
  const [defaultHtml, setDefaultHtml] = useState('');
  const [defaultEmotions, setDefaultEmotions] = useState<Array<{ emotion: EmotionCategory; intensity: EmotionIntensity }>>([]);
  const [autoSaveContent, setAutoSaveContent] = useState({ html: '', text: '' });

  const editorRef = useRef<EditorHandle>(null);
  const emotionSheetRef = useRef<BottomSheet>(null);
  const htmlRef = useRef('');
  const textRef = useRef('');
  const emotionSelectionsRef = useRef<Array<{ emotion: EmotionCategory; intensity: EmotionIntensity }>>([]);

  // Load entry and existing emotions
  useEffect(() => {
    if (!id) return;

    Promise.all([loadEntry(id), getEmotions(id)]).then(([entry, emotions]) => {
      if (entry) {
        setDefaultHtml(entry.contentHtml);
        htmlRef.current = entry.contentHtml;
        textRef.current = entry.contentText;
        setAutoSaveContent({ html: entry.contentHtml, text: entry.contentText });
      }
      if (emotions.length > 0) {
        const mapped = emotions.map((e) => ({
          emotion: e.category,
          intensity: e.intensity,
        }));
        emotionSelectionsRef.current = mapped;
        setDefaultEmotions(mapped);
      }
      setIsLoading(false);
    });
  }, [id, loadEntry, getEmotions]);

  useAutoSave(id ?? null, autoSaveContent);

  const handleEmotionSave = useCallback(
    (selections: readonly { readonly emotion: EmotionCategory; readonly intensity: EmotionIntensity }[]) => {
      emotionSelectionsRef.current = [...selections];
      emotionSheetRef.current?.close();
    },
    [],
  );

  const handleFinish = useCallback(async () => {
    if (!id) return;

    // Final save
    await updateEntry(id, htmlRef.current, textRef.current);

    // Save emotions
    if (emotionSelectionsRef.current.length > 0) {
      await saveEmotions(
        id,
        emotionSelectionsRef.current.map((s) => ({
          category: s.emotion,
          intensity: s.intensity,
        })),
      );
    }

    router.back();
  }, [id, updateEntry, saveEmotions]);

  if (isLoading) {
    return <View className="flex-1 bg-background" />;
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center justify-between p-3 pr-0">
        <Button variant="ghost" size="sm" isIconOnly onPress={() => router.back()}>
          <ChevronLeft size={20} color={muted as string} />
        </Button>
        <View className="flex-row items-center">
          <Button variant="ghost" size="sm" isIconOnly onPress={() => emotionSheetRef.current?.snapToIndex(0)}>
            <SmilePlus size={16} color={muted as string} />
          </Button>
          <View style={{ paddingRight: 12 }}>
            <Button variant="primary" size="sm" isIconOnly onPress={handleFinish}>
              <Check size={16} color={accentForeground as string} />
            </Button>
          </View>
        </View>
      </View>

      <Editor
        ref={editorRef}
        defaultValue={defaultHtml}
        placeholder="Start writing..."
        onChangeText={(text) => {
          textRef.current = text;
          setAutoSaveContent({ html: htmlRef.current, text });
        }}
        onChangeHtml={(html) => {
          htmlRef.current = html;
          setAutoSaveContent({ html, text: textRef.current });
        }}
      />

      <BottomSheet
        ref={emotionSheetRef}
        index={-1}
        enablePanDownToClose
        enableDynamicSizing
        animationConfigs={{}}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
        )}
        maxDynamicContentSize={insets.top > 0 ? undefined : 600}
        backgroundStyle={{ backgroundColor: surface as string }}
        handleIndicatorStyle={{ backgroundColor: muted as string }}
      >
        <BottomSheetScrollView>
          <EmotionCheckin onSave={handleEmotionSave} defaultSelections={defaultEmotions} />
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}
