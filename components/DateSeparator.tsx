import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSettings } from '../utils/settings';

interface DateSeparatorProps {
  date: string;
}

function DateSeparator({ date }: DateSeparatorProps) {
  const { theme } = useSettings();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    };

    if (date.getFullYear() !== today.getFullYear()) {
      options.year = 'numeric';
    }

    return date.toLocaleDateString(undefined, options);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: theme.border }]} />
      <View style={[styles.dateContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.dateText, { color: theme.textSecondary }]}>
          {formatDate(date)}
        </Text>
      </View>
      <View style={[styles.line, { backgroundColor: theme.border }]} />
    </View>
  );
}

export default memo(DateSeparator, (prevProps, nextProps) => {
  const prevDate = new Date(prevProps.date);
  const nextDate = new Date(nextProps.date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const prevIsToday = prevDate >= today;
  const nextIsToday = nextDate >= today;

  return prevProps.date === nextProps.date && prevIsToday === nextIsToday;
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dateContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginHorizontal: 12,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
