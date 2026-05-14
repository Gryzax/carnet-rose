import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { Card, PillButton, type IoniconName } from './Themed';

export interface EmptyStateProps {
  icon?: IoniconName;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({
  icon = 'sparkles-outline',
  title,
  message,
  actionLabel,
  onAction
}: EmptyStateProps) => (
  <Card testID="empty-state" style={styles.container} washi mascot>
    <View style={styles.icon}>
      <Ionicons name={icon} color={colors.ink} size={30} />
    </View>
    <Text accessibilityRole="header" style={styles.title}>
      {title}
    </Text>
    <Text style={styles.message}>{message}</Text>
    {!!actionLabel && !!onAction && (
      <PillButton onPress={onAction} variant="pink" style={styles.action}>
        {actionLabel}
      </PillButton>
    )}
  </Card>
);

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 24, marginVertical: 18 },
  icon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.sage, borderColor: colors.border, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontFamily: 'PatrickHand_400Regular', color: colors.ink, fontSize: 26, textAlign: 'center' },
  message: { fontFamily: 'PatrickHand_400Regular', color: colors.muted, fontSize: 19, textAlign: 'center', lineHeight: 24, marginTop: 6 },
  action: { marginTop: 16, alignSelf: 'stretch' }
});
