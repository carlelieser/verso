import { router } from 'expo-router';
import { Check, History, SmilePlus } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';

import { Button } from 'heroui-native';

import { AppearanceToggle } from '@/components/appearance-toggle';
import { CreateJournal } from '@/components/create-journal';
import { Editor, type EditorHandle } from '@/components/editor';
import { EmotionCheckin } from '@/components/emotion-checkin';
import { EntrySaved } from '@/components/entry-saved';
import { JournalSelect } from '@/components/journal-select';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useEmotions } from '@/hooks/use-emotions';
import { useEntries } from '@/hooks/use-entries';
import { useJournals } from '@/hooks/use-journals';
import type { EmotionCategory, EmotionIntensity } from '@/types/common';

export default function HomeScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { journals, createJournal } = useJournals();
  const { createEntry, deleteEntry, updateEntry } = useEntries();
  const { saveEmotions } = useEmotions();

  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [hasContent, setHasContent] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [autoSaveContent, setAutoSaveContent] = useState({ html: '', text: '' });

  const [muted, surface, accentForeground] = useCSSVariable([
    '--color-muted',
    '--color-surface',
    '--color-accent-foreground',
  ]);

  const emotionSheetRef = useRef<BottomSheet>(null);
  const createSheetRef = useRef<BottomSheet>(null);
  const editorRef = useRef<EditorHandle>(null);
  const emotionSelectionsRef = useRef<Array<{ emotion: EmotionCategory; intensity: EmotionIntensity }>>([]);
  const htmlRef = useRef('');
  const textRef = useRef('');
  const isCreatingRef = useRef(false);

  const checkWidth = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  const checkButtonStyle = useAnimatedStyle(() => ({
    width: checkWidth.value,
    opacity: checkOpacity.value,
    paddingRight: 12,
    overflow: 'hidden' as const,
  }));

  // Default to first journal
  useEffect(() => {
    if (journals.length > 0 && !selectedJournalId) {
      setSelectedJournalId(journals[0]?.id ?? null);
    }
  }, [journals, selectedJournalId]);

  useAutoSave(currentEntryId, autoSaveContent);

  const handleTextChange = useCallback(
    async (text: string, html: string) => {
      const hasText = text.trim().length > 0;
      htmlRef.current = html;
      textRef.current = text;

      if (hasText && !currentEntryId && selectedJournalId && !isCreatingRef.current) {
        // First keystroke — create entry (guard prevents duplicates on fast typing)
        isCreatingRef.current = true;
        const entry = await createEntry(selectedJournalId, html, text);
        setCurrentEntryId(entry.id);
        isCreatingRef.current = false;
      } else if (!hasText && currentEntryId) {
        // All text deleted — remove entry
        await deleteEntry(currentEntryId);
        setCurrentEntryId(null);
      }

      if (currentEntryId) {
        setAutoSaveContent({ html, text });
      }

      setHasContent(hasText);
      checkWidth.value = withSpring(hasText ? 48 : 0);
      checkOpacity.value = withSpring(hasText ? 1 : 0);
    },
    [currentEntryId, selectedJournalId, createEntry, deleteEntry, checkWidth, checkOpacity],
  );

  const openEmotionCheckin = useCallback(() => {
    emotionSheetRef.current?.snapToIndex(0);
  }, []);

  const closeEmotionCheckin = useCallback(() => {
    emotionSheetRef.current?.close();
  }, []);

  const handleEmotionSave = useCallback(
    (selections: readonly { readonly emotion: EmotionCategory; readonly intensity: EmotionIntensity }[]) => {
      emotionSelectionsRef.current = [...selections];
      closeEmotionCheckin();
    },
    [closeEmotionCheckin],
  );

  const handleFinishEntry = useCallback(async () => {
    if (!currentEntryId) return;

    // Final save
    await updateEntry(currentEntryId, htmlRef.current, textRef.current);

    // Save emotions if any were selected
    if (emotionSelectionsRef.current.length > 0) {
      await saveEmotions(
        currentEntryId,
        emotionSelectionsRef.current.map((s) => ({
          category: s.emotion,
          intensity: s.intensity,
        })),
      );
    }

    setShowSaved(true);
  }, [currentEntryId, updateEntry, saveEmotions]);

  const handleSavedComplete = useCallback(() => {
    editorRef.current?.clear();
    setCurrentEntryId(null);
    setHasContent(false);
    setAutoSaveContent({ html: '', text: '' });
    htmlRef.current = '';
    textRef.current = '';
    emotionSelectionsRef.current = [];
    checkWidth.value = withSpring(0);
    checkOpacity.value = withSpring(0);
    setShowSaved(false);
  }, [checkWidth, checkOpacity]);

  const handleCreateJournal = useCallback(
    async (name: string, icon: string) => {
      const journal = await createJournal(name, icon);
      setSelectedJournalId(journal.id);
      createSheetRef.current?.close();
    },
    [createJournal],
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center justify-between p-3 pr-0">
        <View className="flex-row items-center">
          <AppearanceToggle />
          <JournalSelect
            journals={journals}
            selectedId={selectedJournalId}
            onSelect={setSelectedJournalId}
            onCreate={() => createSheetRef.current?.expand()}
            onViewAll={() => router.push('/journals')}
          />
        </View>
        <View className="flex-row items-center">
          <Button variant="ghost" size="sm" isIconOnly onPress={() => router.push('/history')}>
            <History size={16} color={muted as string} />
          </Button>
          <Button variant="ghost" size="sm" isIconOnly onPress={openEmotionCheckin}>
            <SmilePlus size={16} color={muted as string} />
          </Button>
          <Animated.View style={checkButtonStyle}>
            <Button variant="primary" size="sm" isIconOnly onPress={handleFinishEntry}>
              <Check size={16} color={accentForeground as string} />
            </Button>
          </Animated.View>
        </View>
      </View>

      <Editor
        ref={editorRef}
        placeholder="What's on your mind?"
        onChangeText={(text) => handleTextChange(text, htmlRef.current)}
        onChangeHtml={(html) => {
          htmlRef.current = html;
          if (currentEntryId) {
            setAutoSaveContent({ html, text: textRef.current });
          }
        }}
      />

      {/* Emotion check-in bottom sheet */}
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
          {/* Key by currentEntryId to reset internal state between entries */}
          <EmotionCheckin key={currentEntryId ?? 'new'} onSave={handleEmotionSave} />
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Create journal bottom sheet */}
      <BottomSheet
        ref={createSheetRef}
        index={-1}
        enablePanDownToClose
        enableDynamicSizing
        animationConfigs={{}}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.5} />
        )}
        backgroundStyle={{ backgroundColor: surface as string }}
        handleIndicatorStyle={{ backgroundColor: muted as string }}
      >
        <BottomSheetView>
          <CreateJournal onCreate={handleCreateJournal} />
        </BottomSheetView>
      </BottomSheet>

      {showSaved ? <EntrySaved onComplete={handleSavedComplete} /> : null}
    </View>
  );
}
