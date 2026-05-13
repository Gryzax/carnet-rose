import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../constants/colors';
import { useThemeColors } from './Themed';

export const BackButton = ({ navigation, fallbackRoute = 'Classes', color, style, label = 'Retour' }) => {
  const theme = useThemeColors();
  const iconColor = color || (theme.dark ? colors.white : colors.deepPink);

  const handlePress = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    navigation?.navigate?.(fallbackRoute);
  };

  return (
    <TouchableOpacity
      accessibilityLabel={label}
      testID="back-button"
      onPress={handlePress}
      style={[styles.button, { backgroundColor: theme.dark ? colors.darkCard : colors.lightPink }, style]}
    >
      <Ionicons name="chevron-back-outline" size={24} color={iconColor} />
      {!!label && <Text style={[styles.label, { color: iconColor }]}>{label}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    minHeight: 44,
    borderRadius: 50,
    paddingHorizontal: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  label: {
    fontFamily: 'NunitoSans_700Bold',
    fontSize: 14
  }
});
