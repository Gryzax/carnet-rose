import { Animated, StyleSheet, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { colors } from '../constants/colors';

export interface ProgressBarProps {
  value: number;
  max: number;
  color: string;
}

export const ProgressBar = ({ value, max, color }: ProgressBarProps) => {
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(width, {
      toValue: Math.min(value / max, 1),
      friction: 8,
      tension: 90,
      useNativeDriver: false
    }).start();
  }, [value, max, width]);
  return (
    <View style={styles.track} testID="progress-track">
      <Animated.View
        testID="progress-fill"
        style={[
          styles.fill,
          {
            backgroundColor: color,
            width: width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
          }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: { height: 12, borderRadius: 20, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1.5, overflow: 'hidden', flex: 1 },
  fill: { height: '100%', borderRadius: 20 }
});
