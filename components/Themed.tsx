import { forwardRef, type ComponentProps, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewProps,
  type ViewStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../constants/colors';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface ThemeColors {
  dark: boolean;
  bg: string;
  card: string;
  text: string;
  muted: string;
  border: string;
}

export const useThemeColors = (): ThemeColors => ({
  dark: false,
  bg: colors.canvas,
  card: colors.card,
  text: colors.ink,
  muted: colors.muted,
  border: colors.border
});

export const Screen = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => (
  <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, style]}>
    {children}
  </SafeAreaView>
);

// Decorative top-right washi tape. Lives inside the scroll content (not Screen)
// so it scrolls away with the page — only the back button stays pinned.
export const WashiTape = ({ style }: { style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.washi, styles.washiTop, style]} />
);

export const Title = ({
  children,
  style,
  ...props
}: { children: ReactNode; style?: StyleProp<TextStyle> } & TextProps) => (
  <Text accessibilityRole="header" style={[styles.title, style]} {...props}>
    {children}
  </Text>
);

export const Card = ({
  children,
  style,
  washi = false,
  mascot = true,
  ...props
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  washi?: boolean;
  mascot?: boolean;
} & ViewProps) => (
  <View style={[styles.card, style]} {...props}>
    {washi && <View style={styles.cardWashi} />}
    {mascot && <CatMascot />}
    {children}
  </View>
);

export type PillTone = 'sage' | 'pink' | 'orange';

export const Pill = ({
  children,
  tone = 'sage',
  style,
  textStyle,
  ...props
}: {
  children: ReactNode;
  tone?: PillTone;
  style?: StyleProp<TextStyle>;
  textStyle?: StyleProp<TextStyle>;
} & TextProps) => (
  <Text
    style={[
      styles.pill,
      tone === 'pink' && styles.pillPink,
      tone === 'orange' && styles.pillOrange,
      style,
      textStyle
    ]}
    {...props}
  >
    {children}
  </Text>
);

export const Sparkle = ({ style }: { style?: StyleProp<TextStyle> }) => (
  <Text style={[styles.sparkle, style]}>✦</Text>
);

export type PillButtonVariant = 'sage' | 'pink' | 'light' | 'orange' | 'danger';

export const PillButton = ({
  children,
  onPress,
  variant = 'sage',
  style,
  disabled = false,
  testID
}: {
  children: ReactNode;
  onPress?: () => void;
  variant?: PillButtonVariant;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  testID?: string;
}) => (
  <Pressable
    testID={testID}
    disabled={disabled}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ disabled }}
    style={({ pressed }) => [
      styles.button,
      variant === 'pink' && styles.buttonPink,
      variant === 'light' && styles.buttonLight,
      variant === 'orange' && styles.buttonOrange,
      variant === 'danger' && styles.buttonDanger,
      disabled && styles.disabled,
      pressed && !disabled && styles.pressed,
      style
    ]}
  >
    <Text
      style={[
        styles.buttonText,
        (variant === 'pink' || variant === 'orange' || variant === 'danger') && styles.buttonTextOnPink
      ]}
    >
      {children}
    </Text>
  </Pressable>
);

export const IconButton = ({
  icon,
  label,
  onPress,
  style,
  testID,
  accessibilityLabel
}: {
  icon: IoniconName;
  label?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}) => (
  <Pressable
    testID={testID}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel || label}
    onPress={onPress}
    style={({ pressed }) => [styles.iconButton, pressed && styles.pressed, style]}
  >
    <Ionicons name={icon} size={20} color={colors.ink} />
    {!!label && <Text style={styles.iconButtonText}>{label}</Text>}
  </Pressable>
);

export interface SegmentOption<V extends string | number> {
  value: V;
  label: string;
}

export const SegmentedControl = <V extends string | number>({
  options,
  value,
  onChange,
  style
}: {
  options: SegmentOption<V>[];
  value: V;
  onChange: (value: V) => void;
  style?: StyleProp<ViewStyle>;
}) => (
  <View style={[styles.segmented, style]}>
    {options.map((option) => {
      const active = option.value === value;
      return (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
          style={({ pressed }) => [styles.segment, active && styles.segmentActive, pressed && styles.pressed]}
        >
          <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
        </Pressable>
      );
    })}
  </View>
);

interface JournalInputProps extends ComponentProps<typeof TextInput> {
  // When true, shows a round clear button while the field is non-empty.
  clearable?: boolean;
}

export const JournalInput = forwardRef<TextInput, JournalInputProps>(
  ({ style, clearable, value, onChangeText, ...props }, ref) => {
    const input = (
      <TextInput
        ref={ref}
        placeholderTextColor={colors.placeholder}
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, clearable && styles.inputClearable, !clearable && style]}
        {...props}
      />
    );
    if (!clearable) return input;
    return (
      <View style={[styles.inputWrap, style]}>
        {input}
        {!!value && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear"
            hitSlop={8}
            onPress={() => onChangeText?.('')}
            style={styles.inputClear}
          >
            <Ionicons name="close" size={16} color={colors.muted} />
          </Pressable>
        )}
      </View>
    );
  }
);
JournalInput.displayName = 'JournalInput';

export const InfoIcon = () => (
  <View style={styles.infoIcon}>
    <Text style={styles.infoText}>i</Text>
  </View>
);

export const CatMascot = () => (
  <View style={styles.cat}>
    <View style={[styles.catEar, styles.catEarLeft]} />
    <View style={[styles.catEar, styles.catEarRight]} />
    <View style={styles.catHead}>
      <View style={styles.catPatch} />
      <Text style={styles.catText}>• ᴗ •</Text>
    </View>
  </View>
);

const baseText: TextStyle = {
  fontFamily: typography.regular,
  color: colors.ink,
  letterSpacing: 0
};

const bordered: ViewStyle = {
  borderColor: colors.border,
  borderWidth: 1.5
};

const styles = StyleSheet.create({
  // No paddingTop: scroll content runs to the top edge so nothing peeks above
  // it. Screens add their own top inset via the scroll contentContainerStyle.
  // No horizontal padding here: screens add it on their own scroll content so
  // that full-bleed rows (e.g. swipe-to-delete) can reach the screen edges.
  screen: { flex: 1, backgroundColor: colors.canvas, paddingBottom: spacing.md },
  washi: { position: 'absolute', backgroundColor: colors.orange, opacity: 0.28, transform: [{ rotate: '-8deg' }], pointerEvents: 'none' },
  washiTop: { width: 132, height: 28, top: 14, right: -18 },
  title: { ...baseText, fontSize: 34, lineHeight: 40, marginBottom: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md, ...bordered },
  cardWashi: { position: 'absolute', top: -10, alignSelf: 'center', width: 86, height: 24, borderRadius: 3, backgroundColor: colors.orange, opacity: 0.84, transform: [{ rotate: '-4deg' }], pointerEvents: 'none' },
  pill: { ...baseText, alignSelf: 'flex-start', overflow: 'hidden', borderRadius: radii.full, backgroundColor: colors.sage, paddingHorizontal: 12, paddingVertical: 5, fontSize: 15, textTransform: 'uppercase', ...bordered },
  pillPink: { backgroundColor: colors.pink, color: colors.white },
  pillOrange: { backgroundColor: colors.orangeSoft },
  sparkle: { color: colors.orange, fontSize: 18, lineHeight: 22 },
  button: { minHeight: 48, borderRadius: radii.sm, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, paddingVertical: 12, ...bordered },
  buttonPink: { backgroundColor: colors.pink },
  buttonLight: { backgroundColor: colors.card },
  buttonOrange: { backgroundColor: colors.orange },
  buttonDanger: { backgroundColor: colors.dangerRed },
  buttonText: { ...baseText, fontSize: 20, textAlign: 'center' },
  buttonTextOnPink: { color: colors.white },
  disabled: { opacity: 0.55 },
  pressed: { transform: [{ scale: 0.97 }] },
  iconButton: { minHeight: 44, borderRadius: radii.full, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.lightPink, ...bordered },
  iconButtonText: { ...baseText, fontSize: 17 },
  segmented: { flexDirection: 'row', borderRadius: radii.full, padding: 3, gap: 2, backgroundColor: colors.card, ...bordered },
  segment: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radii.full, paddingHorizontal: 10 },
  segmentActive: { backgroundColor: colors.pink },
  segmentText: { ...baseText, fontSize: 17, textTransform: 'uppercase' },
  segmentTextActive: { color: colors.white },
  input: { ...baseText, minHeight: 48, backgroundColor: colors.card, borderRadius: radii.md, paddingHorizontal: spacing.md, fontSize: 20, ...bordered },
  inputWrap: { position: 'relative', justifyContent: 'center' },
  inputClearable: { paddingRight: 44 },
  inputClear: {
    position: 'absolute',
    right: 10,
    width: 26,
    height: 26,
    borderRadius: radii.full,
    backgroundColor: colors.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  infoIcon: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.orangeSoft, alignItems: 'center', justifyContent: 'center' },
  infoText: { ...baseText, fontSize: 19, lineHeight: 22 },
  cat: { position: 'absolute', right: 12, top: -19, width: 42, height: 34, alignItems: 'center', zIndex: 5, pointerEvents: 'none' },
  catEar: { position: 'absolute', top: 1, width: 14, height: 14, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1.5, transform: [{ rotate: '45deg' }] },
  catEarLeft: { left: 5 },
  catEarRight: { right: 5 },
  catHead: { position: 'absolute', bottom: 0, width: 32, height: 26, borderRadius: 13, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  catPatch: { position: 'absolute', top: -3, right: 2, width: 13, height: 15, borderRadius: 7, backgroundColor: colors.orangeSoft, transform: [{ rotate: '14deg' }] },
  catText: { ...baseText, fontSize: 11, lineHeight: 13 }
});
