import { StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { colors } from '../constants/colors';

export const useThemeColors = () => {
  const dark = useColorScheme() === 'dark';
  return {
    dark,
    bg: dark ? colors.darkBg : colors.offWhite,
    card: dark ? colors.darkCard : colors.white,
    text: dark ? colors.white : colors.textDark,
    muted: dark ? colors.softPink : colors.textMuted,
    border: dark ? '#4A2434' : colors.lightPink
  };
};

export const Screen = ({ children }) => {
  const theme = useThemeColors();
  return <View style={[styles.screen, { backgroundColor: theme.bg }]}>{children}</View>;
};

export const Title = ({ children, style }) => {
  const theme = useThemeColors();
  return <Text style={[styles.title, { color: theme.text }, style]}>{children}</Text>;
};

export const PillButton = ({ children, onPress, variant = 'primary', style }) => (
  <TouchableOpacity onPress={onPress} style={[styles.button, variant === 'light' && styles.lightButton, style]}>
    <Text style={[styles.buttonText, variant === 'light' && { color: colors.deepPink }]}>{children}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
  title: { fontFamily: 'Nunito_800ExtraBold', fontSize: 30, marginBottom: 12 },
  button: { backgroundColor: colors.primaryPink, borderRadius: 50, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center' },
  lightButton: { backgroundColor: colors.lightPink },
  buttonText: { color: colors.white, fontFamily: 'NunitoSans_700Bold', fontSize: 16 }
});
