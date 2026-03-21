import { useCallback, useEffect, useMemo, useState } from 'react';

import { useDatabaseContext } from '@/providers/database-provider';
import { createInsightsService } from '@/services/insights-service';
import type { TimeRange } from '@/types/common';
import type { DayMood, EmotionRanking, MoodDataPoint, StreakData } from '@/types/emotion';

interface UseInsightsResult {
  readonly streak: StreakData | null;
  readonly heatmap: readonly DayMood[];
  readonly moodTrends: readonly MoodDataPoint[];
  readonly topEmotions: readonly EmotionRanking[];
  readonly timeRange: TimeRange;
  readonly setTimeRange: (range: TimeRange) => void;
  readonly heatmapMonth: number;
  readonly heatmapYear: number;
  readonly setHeatmapMonth: (month: number, year: number) => void;
  readonly isLoadingStreak: boolean;
  readonly isLoadingHeatmap: boolean;
  readonly isLoadingTrends: boolean;
  readonly isLoadingTopEmotions: boolean;
  readonly error: Error | null;
  readonly refresh: () => void;
}

export function useInsights(): UseInsightsResult {
  const { db } = useDatabaseContext();
  const service = useMemo(() => createInsightsService(db), [db]);

  const now = new Date();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [heatmapMonth, setHeatmapMonthState] = useState(now.getMonth() + 1);
  const [heatmapYear, setHeatmapYearState] = useState(now.getFullYear());

  const [streak, setStreak] = useState<StreakData | null>(null);
  const [heatmap, setHeatmap] = useState<readonly DayMood[]>([]);
  const [moodTrends, setMoodTrends] = useState<readonly MoodDataPoint[]>([]);
  const [topEmotions, setTopEmotions] = useState<readonly EmotionRanking[]>([]);

  const [isLoadingStreak, setIsLoadingStreak] = useState(true);
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(true);
  const [isLoadingTrends, setIsLoadingTrends] = useState(true);
  const [isLoadingTopEmotions, setIsLoadingTopEmotions] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadStreak = useCallback(() => {
    try {
      setIsLoadingStreak(true);
      const result = service.getStreak();
      setStreak(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoadingStreak(false);
    }
  }, [service]);

  const loadHeatmap = useCallback(() => {
    try {
      setIsLoadingHeatmap(true);
      const result = service.getMoodHeatmap({ month: heatmapMonth, year: heatmapYear });
      setHeatmap(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoadingHeatmap(false);
    }
  }, [service, heatmapMonth, heatmapYear]);

  const loadTrends = useCallback(() => {
    try {
      setIsLoadingTrends(true);
      const result = service.getMoodTrendsChart({ range: timeRange });
      setMoodTrends(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoadingTrends(false);
    }
  }, [service, timeRange]);

  const loadTopEmotions = useCallback(() => {
    try {
      setIsLoadingTopEmotions(true);
      const result = service.getTopEmotions({ range: timeRange });
      setTopEmotions(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoadingTopEmotions(false);
    }
  }, [service, timeRange]);

  const refresh = useCallback(() => {
    setError(null);
    loadStreak();
    loadHeatmap();
    loadTrends();
    loadTopEmotions();
  }, [loadStreak, loadHeatmap, loadTrends, loadTopEmotions]);

  useEffect(() => {
    loadStreak();
  }, [loadStreak]);

  useEffect(() => {
    loadHeatmap();
  }, [loadHeatmap]);

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  useEffect(() => {
    loadTopEmotions();
  }, [loadTopEmotions]);

  const setHeatmapMonth = useCallback((month: number, year: number) => {
    setHeatmapMonthState(month);
    setHeatmapYearState(year);
  }, []);

  return {
    streak,
    heatmap,
    moodTrends,
    topEmotions,
    timeRange,
    setTimeRange,
    heatmapMonth,
    heatmapYear,
    setHeatmapMonth,
    isLoadingStreak,
    isLoadingHeatmap,
    isLoadingTrends,
    isLoadingTopEmotions,
    error,
    refresh,
  };
}
