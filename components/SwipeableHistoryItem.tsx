import { useRef } from 'react';
import type { ReactNode } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../constants/colors';

const DELETE_WIDTH = 72;
// A swipe that travels past this fraction of the row width deletes outright,
// no confirmation — the gesture itself is the intent.
const FULL_SWIPE_RATIO = 0.5;
// The list lives inside a screen with `spacing.md` horizontal padding. We bleed
// the row out to the screen edges so the swipe reveal isn't clipped by that
// padding, then re-inset the card itself to keep its resting position.
const GUTTER = spacing.md;

interface SwipeableHistoryItemProps {
  // Tapping the revealed trash button — kept behind a confirmation upstream.
  onDelete: () => void;
  // A long swipe-away — deletes immediately, no confirmation.
  onSwipeAwayDelete: () => void;
  deleteLabel: string;
  children: ReactNode;
}

export const SwipeableHistoryItem = ({
  onDelete,
  onSwipeAwayDelete,
  deleteLabel,
  children
}: SwipeableHistoryItemProps) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);
  const widthRef = useRef(0);

  const settle = (toValue: number) => {
    offset.current = toValue;
    Animated.spring(translateX, { toValue, useNativeDriver: true, bounciness: 0 }).start();
  };

  const swipeAway = () => {
    const target = -(widthRef.current || DELETE_WIDTH);
    offset.current = target;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(translateX, { toValue: target, duration: 160, useNativeDriver: true }).start(
      () => onSwipeAwayDelete()
    );
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => {
        const min = -(widthRef.current || DELETE_WIDTH);
        const next = Math.min(0, Math.max(min, offset.current + gesture.dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        const next = offset.current + gesture.dx;
        const fullThreshold = widthRef.current * FULL_SWIPE_RATIO;
        if (widthRef.current > 0 && (-next >= fullThreshold || gesture.vx < -0.8)) {
          swipeAway();
        } else {
          settle(next < -DELETE_WIDTH / 2 ? -DELETE_WIDTH : 0);
        }
      }
    })
  ).current;

  return (
    <View
      style={styles.wrapper}
      onLayout={(e) => {
        widthRef.current = e.nativeEvent.layout.width;
      }}
    >
      {/* A full-width red bed sits behind the card; the trash button is pinned
          to its right edge so a short swipe reveals just the button while a
          long swipe drags the whole card across the red. */}
      <View style={styles.deleteLayer} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={deleteLabel}
          style={styles.deleteButton}
          onPress={() => {
            settle(0);
            onDelete();
          }}
        >
          <Ionicons name="trash-outline" size={22} color={colors.onPrimary} />
        </Pressable>
      </View>
      <Animated.View
        style={[styles.card, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
    marginHorizontal: -GUTTER,
    overflow: 'hidden'
  },
  card: { marginHorizontal: GUTTER },
  // Inset to exactly the card's resting footprint so the card fully covers the
  // red bed at rest — it's only revealed once the swipe begins.
  deleteLayer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: GUTTER,
    right: GUTTER,
    backgroundColor: colors.dangerRed,
    borderRadius: radii.md,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: (DELETE_WIDTH - 44) / 2
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
