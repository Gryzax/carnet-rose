import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { PillButton, useThemeColors } from './Themed';

export const EmptyState = ({ icon = 'sparkles-outline', title, message, actionLabel, onAction }) => {
  const theme = useThemeColors();
  return (
    <View testID="empty-state" style={[styles.container, { backgroundColor: theme.card }]}>
      <View style={styles.icon}>
        <Ionicons name={icon} color={colors.deepPink} size={30} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.muted }]}>{message}</Text>
      {!!actionLabel && !!onAction && <PillButton onPress={onAction} style={styles.action}>{actionLabel}</PillButton>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', borderRadius: 20, padding: 24, marginVertical: 18, shadowColor: colors.primaryPink, shadowOpacity: 0.12, shadowRadius: 10, elevation: 2 },
  icon: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.lightPink, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontFamily: 'Nunito_800ExtraBold', fontSize: 22, textAlign: 'center' },
  message: { fontFamily: 'NunitoSans_400Regular', fontSize: 16, textAlign: 'center', lineHeight: 22, marginTop: 6 },
  action: { marginTop: 16 }
});
