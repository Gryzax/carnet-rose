import { forwardRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../constants/colors';

export const useThemeColors = () => ({
  dark: false,
  bg: colors.canvas,
  card: colors.card,
  text: colors.ink,
  muted: colors.muted,
  border: colors.border
});

export const Screen = ({ children, style }) => (
  <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, style]}>
    <View pointerEvents="none" style={[styles.washi, styles.washiTop]} />
    {children}
  </SafeAreaView>
);

export const Title = ({ children, style }) => <Text style={[styles.title, style]}>{children}</Text>;

export const Card = ({ children, style, washi = false, mascot = false, ...props }) => (
  <View style={[styles.card, style]} {...props}>
    {washi && <View pointerEvents="none" style={styles.cardWashi} />}
    {mascot && <CatMascot />}
    {children}
  </View>
);

export const Pill = ({ children, tone = 'sage', style, textStyle }) => (
  <Text style={[styles.pill, tone === 'pink' && styles.pillPink, tone === 'orange' && styles.pillOrange, style, textStyle]}>{children}</Text>
);

export const Sparkle = ({ style }) => <Text style={[styles.sparkle, style]}>✦</Text>;

export const PillButton = ({ children, onPress, variant = 'sage', style, disabled = false, testID }) => (
  <Pressable
    testID={testID}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [
      styles.button,
      variant === 'pink' && styles.buttonPink,
      variant === 'light' && styles.buttonLight,
      disabled && styles.disabled,
      pressed && !disabled && styles.pressed,
      style
    ]}
  >
    <Text style={styles.buttonText}>{children}</Text>
  </Pressable>
);

export const IconButton = ({ icon, label, onPress, style, testID, accessibilityLabel }) => (
  <Pressable testID={testID} accessibilityLabel={accessibilityLabel || label} onPress={onPress} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed, style]}>
    <Ionicons name={icon} size={20} color={colors.ink} />
    {!!label && <Text style={styles.iconButtonText}>{label}</Text>}
  </Pressable>
);

export const SegmentedControl = ({ options, value, onChange, style }) => (
  <View style={[styles.segmented, style]}>
    {options.map((option) => {
      const active = option.value === value;
      return (
        <Pressable key={option.value} onPress={() => onChange(option.value)} style={({ pressed }) => [styles.segment, active && styles.segmentActive, pressed && styles.pressed]}>
          <Text style={styles.segmentText}>{option.label}</Text>
        </Pressable>
      );
    })}
  </View>
);

export const JournalInput = forwardRef(({ style, ...props }, ref) => (
  <TextInput ref={ref} placeholderTextColor={colors.placeholder} style={[styles.input, style]} {...props} />
));

export const InfoIcon = () => (
  <View style={styles.infoIcon}>
    <Text style={styles.infoText}>i</Text>
  </View>
);

export const CatMascot = () => (
  <Animated.View pointerEvents="none" style={styles.cat}>
    <View style={styles.catEarLeft} />
    <View style={styles.catEarRight} />
    <View style={styles.catFace}>
      <Text style={styles.catText}>• ᴗ •</Text>
      <View style={styles.catPatch} />
    </View>
  </Animated.View>
);

const baseText = {
  fontFamily: typography.regular,
  color: colors.ink,
  letterSpacing: 0
};

const bordered = {
  borderColor: colors.border,
  borderWidth: 1.5
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, padding: spacing.md },
  washi: { position: 'absolute', backgroundColor: colors.orange, opacity: 0.28, transform: [{ rotate: '-8deg' }] },
  washiTop: { width: 132, height: 28, top: 14, right: -18 },
  title: { ...baseText, fontSize: 34, lineHeight: 40, marginBottom: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md, ...bordered },
  cardWashi: { position: 'absolute', top: -10, alignSelf: 'center', width: 86, height: 24, borderRadius: 3, backgroundColor: colors.orange, opacity: 0.84, transform: [{ rotate: '-4deg' }] },
  pill: { ...baseText, alignSelf: 'flex-start', overflow: 'hidden', borderRadius: radii.full, backgroundColor: colors.sage, paddingHorizontal: 12, paddingVertical: 5, fontSize: 15, textTransform: 'uppercase', ...bordered },
  pillPink: { backgroundColor: colors.pink },
  pillOrange: { backgroundColor: colors.orangeSoft },
  sparkle: { color: colors.orange, fontSize: 18, lineHeight: 22 },
  button: { minHeight: 48, borderRadius: radii.sm, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, paddingVertical: 12, ...bordered },
  buttonPink: { backgroundColor: colors.pink },
  buttonLight: { backgroundColor: colors.card },
  buttonText: { ...baseText, fontSize: 20, textAlign: 'center' },
  disabled: { opacity: 0.55 },
  pressed: { transform: [{ scale: 0.97 }] },
  iconButton: { minHeight: 44, borderRadius: radii.full, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.lightPink, ...bordered },
  iconButtonText: { ...baseText, fontSize: 17 },
  segmented: { flexDirection: 'row', borderRadius: radii.full, padding: 3, gap: 2, backgroundColor: colors.card, ...bordered },
  segment: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radii.full, paddingHorizontal: 10 },
  segmentActive: { backgroundColor: colors.pink },
  segmentText: { ...baseText, fontSize: 17, textTransform: 'uppercase' },
  input: { ...baseText, minHeight: 48, backgroundColor: colors.card, borderRadius: radii.md, paddingHorizontal: spacing.md, fontSize: 20, ...bordered },
  infoIcon: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.orangeSoft, alignItems: 'center', justifyContent: 'center' },
  infoText: { ...baseText, fontSize: 19, lineHeight: 22 },
  cat: { position: 'absolute', right: 12, top: -18, width: 58, height: 58 },
  catFace: { position: 'absolute', left: 4, right: 4, top: 14, bottom: 0, borderRadius: 26, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  catText: { ...baseText, fontSize: 14, marginTop: 4 },
  catPatch: { position: 'absolute', right: 5, top: 6, width: 14, height: 18, borderRadius: 10, backgroundColor: colors.orangeSoft },
  catEarLeft: { position: 'absolute', left: 9, top: 6, width: 17, height: 17, backgroundColor: colors.card, borderLeftWidth: 1.5, borderTopWidth: 1.5, borderColor: colors.border, transform: [{ rotate: '45deg' }] },
  catEarRight: { position: 'absolute', right: 9, top: 6, width: 17, height: 17, backgroundColor: colors.card, borderRightWidth: 1.5, borderTopWidth: 1.5, borderColor: colors.border, transform: [{ rotate: '-45deg' }] }
});
