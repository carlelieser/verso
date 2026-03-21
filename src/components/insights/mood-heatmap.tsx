import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { EMOTION_COLOR_MAP } from '@/constants/emotions';
import { COLORS, RADII, SPACING } from '@/constants/theme';
import type { DayMood } from '@/types/emotion';

const CELL_SIZE = 28;
const CELL_GAP = 4;
const DAYS_IN_WEEK = 7;
const EMPTY_CELL_COLOR = '#2A2A2C';
const DEFAULT_CELL_COLOR = '#3A3A3C';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

interface MoodHeatmapProps {
  readonly data: readonly DayMood[];
  readonly month: number;
  readonly year: number;
}

/** Builds a lookup map from date string to DayMood for O(1) access. */
function buildMoodLookup(data: readonly DayMood[]): ReadonlyMap<string, DayMood> {
  const map = new Map<string, DayMood>();
  for (const mood of data) {
    map.set(mood.date, mood);
  }
  return map;
}

/**
 * Calendar-style heatmap showing emotion-colored cells for each day of a month.
 * Days with entries are filled with the dominant emotion's color at varying opacity
 * based on intensity. Days without entries show a neutral dark cell.
 *
 * @param props.data - Mood data for each day in the month
 * @param props.month - Month number (1-12)
 * @param props.year - Full year number
 */
export function MoodHeatmap({ data, month, year }: MoodHeatmapProps): React.JSX.Element {
  const { grid, totalRows, gridWidth } = useMemo(() => {
    const moodLookup = buildMoodLookup(data);
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDayOfWeek = firstDay.getDay();

    const cells: Array<{
      readonly day: number;
      readonly row: number;
      readonly col: number;
      readonly color: string;
      readonly opacity: number;
    }> = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const col = (startDayOfWeek + day - 1) % DAYS_IN_WEEK;
      const row = Math.floor((startDayOfWeek + day - 1) / DAYS_IN_WEEK);
      const dateString = `${String(year)}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const mood = moodLookup.get(dateString);

      let color = EMPTY_CELL_COLOR;
      let opacity = 1;

      if (mood?.hasEntry && mood.dominantEmotion) {
        color = EMOTION_COLOR_MAP[mood.dominantEmotion];
        opacity = mood.intensity !== undefined ? 0.4 + (mood.intensity / 5) * 0.6 : 0.7;
      } else if (mood?.hasEntry) {
        color = DEFAULT_CELL_COLOR;
      }

      cells.push({ day, row, col, color, opacity });
    }

    const computedRows = cells.length > 0
      ? Math.max(...cells.map((c) => c.row)) + 1
      : 0;
    const computedWidth = DAYS_IN_WEEK * (CELL_SIZE + CELL_GAP) - CELL_GAP;

    return { grid: cells, totalRows: computedRows, gridWidth: computedWidth };
  }, [data, month, year]);

  const svgHeight = totalRows * (CELL_SIZE + CELL_GAP) - CELL_GAP;

  return (
    <View style={styles.container}>
      <View style={styles.dayLabelsRow}>
        {DAY_LABELS.map((label) => (
          <Text key={label} style={styles.dayLabel}>{label}</Text>
        ))}
      </View>
      <View style={styles.svgWrapper}>
        <Svg width={gridWidth} height={svgHeight}>
          {grid.map((cell) => (
            <Rect
              key={cell.day}
              x={cell.col * (CELL_SIZE + CELL_GAP)}
              y={cell.row * (CELL_SIZE + CELL_GAP)}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={RADII.sm}
              fill={cell.color}
              opacity={cell.opacity}
            />
          ))}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  dayLabelsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    width: DAYS_IN_WEEK * (CELL_SIZE + CELL_GAP) - CELL_GAP,
    justifyContent: 'space-around',
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.text.tertiary,
    width: CELL_SIZE,
    textAlign: 'center',
  },
  svgWrapper: {
    alignItems: 'center',
  },
});
