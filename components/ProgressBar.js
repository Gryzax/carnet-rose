import { Animated, StyleSheet, View } from 'react-native';
import { useEffect, useRef } from 'react';

export const ProgressBar = ({ value, max, color }) => {
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(width, { toValue: Math.min(value / max, 1), duration: 300, useNativeDriver: false }).start();
  }, [value, max, width]);
  return (
    <View style={styles.track} testID="progress-track">
      <Animated.View testID="progress-fill" style={[styles.fill, { backgroundColor: color, width: width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  track: { height: 10, borderRadius: 20, backgroundColor: '#F7DDEA', overflow: 'hidden', flex: 1 },
  fill: { height: 10, borderRadius: 20 }
});
