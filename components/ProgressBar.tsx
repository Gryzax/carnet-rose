import { Animated, StyleSheet, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { colors } from '../constants/colors';

export interface ProgressBarProps {
  value: number;
  max: number;
  color: string;
  // When provided, the bar is exposed to screen readers as a progress bar with
  // this label. Left undefined the bar is decorative (e.g. inside StudentCard,
  // where an adjacent "3/5" count already conveys the value) and is hidden.
  label?: string;
}

export const ProgressBar = ({ value, max, color, label }: ProgressBarProps) => {
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(width, {
      toValue: Math.min(value / max, 1),
      friction: 8,
      tension: 90,
      useNativeDriver: false,
    }).start();
  }, [value, max, width]);
  return (
    <View
      style={styles.track}
      testID="progress-track"
      accessible={label !== undefined}
      accessibilityElementsHidden={label === undefined}
      importantForAccessibility={label === undefined ? 'no-hide-descendants' : 'yes'}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max, now: Math.min(value, max) }}
    >
      <Animated.View
        testID="progress-fill"
        style={[
          styles.fill,
          {
            backgroundColor: color,
            width: width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 12,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1.5,
    overflow: 'hidden',
    flex: 1,
  },
  fill: { height: '100%', borderRadius: 20 },
});
