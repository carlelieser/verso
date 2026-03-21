import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import type { DateData } from 'react-native-calendars';

import { DayCell } from '@/components/calendar/day-cell';
import { COLORS } from '@/constants/theme';
import type { EmotionCategory } from '@/types/common';
import type { DayMood } from '@/types/emotion';
import { getDateString } from '@/utils/date';

interface MoodCalendarProps {
  readonly dayMoods: readonly DayMood[];
  readonly onDayPress: (date: string) => void;
  readonly selectedDate?: string;
  readonly currentMonth?: string;
  readonly onMonthChange?: (date: DateData) => void;
}

/** Map from date string to dominant emotion for fast lookup in day rendering. */
function buildMoodMap(dayMoods: readonly DayMood[]): ReadonlyMap<string, EmotionCategory | undefined> {
  const map = new Map<string, EmotionCategory | undefined>();
  for (const mood of dayMoods) {
    map.set(mood.date, mood.dominantEmotion);
  }
  return map;
}

/**
 * Calendar grid that displays mood-colored dots on each day.
 * Wraps react-native-calendars Calendar with a custom dayComponent
 * that renders DayCell with emotion data.
 */
export function MoodCalendar({
  dayMoods,
  onDayPress,
  selectedDate,
  currentMonth,
  onMonthChange,
}: MoodCalendarProps): React.JSX.Element {
  const moodMap = useMemo(() => buildMoodMap(dayMoods), [dayMoods]);
  const todayString = useMemo(() => getDateString(Date.now()), []);

  const handleDayPress = useCallback(
    (dateData: DateData) => {
      onDayPress(dateData.dateString);
    },
    [onDayPress],
  );

  const renderDay = useCallback(
    (props: { date?: DateData; state?: string }) => {
      const dateString = props.date?.dateString ?? '';
      const dayNumber = props.date ? String(props.date.day) : '';
      const isDisabled = props.state === 'disabled';
      const isToday = dateString === todayString;
      const isSelected = dateString === selectedDate;
      const dominantEmotion = moodMap.get(dateString);

      return (
        <DayCell
          date={dateString}
          dayNumber={dayNumber}
          isToday={isToday}
          isSelected={isSelected}
          isDisabled={isDisabled}
          dominantEmotion={dominantEmotion}
          onPress={onDayPress}
        />
      );
    },
    [todayString, selectedDate, moodMap, onDayPress],
  );

  return (
    <View style={styles.container}>
      <Calendar
        current={currentMonth}
        onDayPress={handleDayPress}
        onMonthChange={onMonthChange}
        dayComponent={renderDay}
        hideExtraDays
        hideArrows
        renderHeader={() => null}
        enableSwipeMonths
        theme={calendarTheme}
      />
    </View>
  );
}

const calendarTheme = {
  calendarBackground: COLORS.background,
  monthTextColor: COLORS.text.primary,
  textMonthFontSize: 18,
  textMonthFontWeight: '600' as const,
  arrowColor: COLORS.accent,
  textSectionTitleColor: COLORS.text.secondary,
  textDayHeaderFontSize: 12,
  textDayHeaderFontWeight: '500' as const,
} as const;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
  },
});
