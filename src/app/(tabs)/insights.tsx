import React, { useCallback, useRef } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/common/empty-state';
import { EmotionFrequency } from '@/components/insights/emotion-frequency';
import { MoodHeatmap } from '@/components/insights/mood-heatmap';
import { MoodTrendChart } from '@/components/insights/mood-trend-chart';
import { StreakCounter } from '@/components/insights/streak-counter';
import { COLORS, RADII, SPACING } from '@/constants/theme';
import { useInsights } from '@/hooks/use-insights';
import type { TimeRange } from '@/types/common';
import { exportInsightAsImage, shareInsight } from '@/utils/insight-export';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export default function InsightsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {
    streak,
    heatmap,
    moodTrends,
    topEmotions,
    timeRange,
    setTimeRange,
    heatmapMonth,
    heatmapYear,
    isLoadingStreak,
    isLoadingTrends,
    isLoadingTopEmotions,
  } = useInsights();

  const scrollContentRef = useRef<View>(null);

  const handleRangeChange = useCallback(
    (range: TimeRange) => {
      setTimeRange(range);
    },
    [setTimeRange],
  );

  const handleShare = useCallback(async () => {
    if (scrollContentRef.current === null) return;
    try {
      const uri = await exportInsightAsImage(scrollContentRef);
      await shareInsight(uri);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to share insights';
      Alert.alert('Export Failed', message);
    }
  }, []);

  const hasData = streak !== null && streak.totalEntries > 0;

  if (!hasData && !isLoadingStreak) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <EmptyState
          icon="📊"
          title="Insights"
          description="Write more entries to unlock emotional insights and trends."
        />
      </View>
    );
  }

  const heatmapTitle = `${MONTH_NAMES[heatmapMonth - 1] ?? 'Unknown'} ${String(heatmapYear)}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Insights</Text>
        <Pressable
          style={styles.shareButton}
          accessibilityRole="button"
          accessibilityLabel="Share insights"
          onPress={handleShare}
        >
          <Text style={styles.shareIcon}>↗</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View ref={scrollContentRef} collapsable={false}>
        {streak !== null ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Streak</Text>
            <StreakCounter streakData={streak} />
          </View>
        ) : null}

        {!isLoadingTopEmotions && topEmotions.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mood Breakdown</Text>
            <View style={styles.card}>
              <EmotionFrequency data={topEmotions} />
            </View>
          </View>
        ) : null}

        {!isLoadingTrends ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mood Trends</Text>
            <MoodTrendChart
              data={moodTrends}
              range={timeRange}
              onRangeChange={handleRangeChange}
            />
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{heatmapTitle}</Text>
          <MoodHeatmap
            data={heatmap}
            month={heatmapMonth}
            year={heatmapYear}
          />
        </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  shareButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADII.full,
  },
  shareIcon: {
    fontSize: 18,
    color: COLORS.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING['4xl'],
  },
  section: {
    marginBottom: SPACING['2xl'],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
  },
});
