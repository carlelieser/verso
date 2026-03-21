import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { EMOTION_COLOR_MAP } from '@/constants/emotions';
import { COLORS, RADII, SPACING } from '@/constants/theme';
import type { TimeRange } from '@/types/common';
import type { MoodDataPoint } from '@/types/emotion';

const TIME_RANGE_OPTIONS: readonly { readonly value: TimeRange; readonly label: string }[] = [
  { value: 'week', label: '1W' },
  { value: 'month', label: '1M' },
  { value: '3months', label: '3M' },
  { value: 'year', label: '1Y' },
] as const;

interface MoodTrendChartProps {
  readonly data: readonly MoodDataPoint[];
  readonly range: TimeRange;
  readonly onRangeChange: (range: TimeRange) => void;
}

/** Formats a date string for chart x-axis labels based on the active time range. */
function formatChartLabel(dateString: string, range: TimeRange): string {
  const date = new Date(`${dateString}T12:00:00`);
  if (range === 'week') {
    return date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
  }
  if (range === 'year') {
    return date.toLocaleDateString('en-US', { month: 'short' }).slice(0, 3);
  }
  return `${String(date.getMonth() + 1)}/${String(date.getDate())}`;
}

/**
 * Line chart showing emotion intensity over time, with selectable time range tabs.
 * Each data point is colored by its emotion category.
 *
 * @param props.data - Mood data points to plot
 * @param props.range - Currently active time range
 * @param props.onRangeChange - Callback when user selects a different range
 */
export function MoodTrendChart({ data, range, onRangeChange }: MoodTrendChartProps): React.JSX.Element {
  const chartData = useMemo(() => {
    const maxLabels = range === 'week' ? 7 : range === 'month' ? 8 : range === '3months' ? 6 : 12;
    const labelInterval = Math.max(1, Math.floor(data.length / maxLabels));

    return data.map((point, index) => ({
      value: point.intensity,
      dataPointColor: EMOTION_COLOR_MAP[point.category],
      label: index % labelInterval === 0 ? formatChartLabel(point.date, range) : '',
      labelTextStyle: { color: COLORS.text.tertiary, fontSize: 10 },
    }));
  }, [data, range]);

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {TIME_RANGE_OPTIONS.map((option) => {
          const isActive = option.value === range;
          return (
            <Pressable
              key={option.value}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onRangeChange(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Show ${option.label} range`}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {chartData.length > 0 ? (
        <View style={styles.chartWrapper}>
          <LineChart
            data={chartData}
            height={160}
            spacing={chartData.length > 1 ? Math.max(20, 280 / chartData.length) : 40}
            color={COLORS.accent}
            thickness={2}
            dataPointsRadius={4}
            startFillColor={COLORS.accent}
            endFillColor={COLORS.background}
            startOpacity={0.2}
            endOpacity={0}
            areaChart
            curved
            yAxisColor="transparent"
            xAxisColor={COLORS.border}
            yAxisTextStyle={{ color: COLORS.text.tertiary, fontSize: 10 }}
            noOfSections={5}
            maxValue={5}
            rulesColor={COLORS.border}
            rulesType="dashed"
          />
        </View>
      ) : (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>Not enough data for this range</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
  },
  tabRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.md,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  tabActive: {
    backgroundColor: COLORS.accent,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  tabTextActive: {
    color: COLORS.background,
  },
  chartWrapper: {
    marginLeft: -SPACING.sm,
  },
  emptyChart: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
});
