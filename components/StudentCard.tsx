import { memo, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { CROSSES_FOR_DETENTION, TICKS_FOR_MERIT } from '../constants/config';
import { ProgressBar } from './ProgressBar';
import { StudentAvatar, getStudentAvatarColor, type StudentLike } from './StudentAvatar';
import { CatMascot, Pill, Sparkle } from './Themed';
import { useT } from '../utils/i18n';
import type { StudentRow } from '../types/domain';

export const getStudentStateColor = (student: StudentLike): string => getStudentAvatarColor(student);

export interface StudentCardProps {
  student: StudentRow;
  onPress?: () => void;
  onMenu?: () => void;
}

const StudentCardBase = ({ student, onPress, onMenu }: StudentCardProps) => {
  const { t } = useT();
  const fade = useRef(new Animated.Value(0)).current;
  const atRisk = student.crosses >= CROSSES_FOR_DETENTION - 1;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [fade]);

  return (
    <Animated.View style={{ opacity: fade }}>
      <Pressable
        testID="student-card"
        accessibilityRole="button"
        accessibilityLabel={`${student.lastName} ${student.firstName}`}
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <View style={styles.washi} />
        <CatMascot />
        <View style={styles.header}>
          <StudentAvatar student={student} />
          <View style={styles.nameBlock}>
            <View style={styles.nameRow}>
              <Text accessibilityRole="header" style={styles.name}>
                {student.lastName.toUpperCase()} {student.firstName}
              </Text>
              {atRisk && (
                <View
                  testID={`at-risk-badge-${student.id}`}
                  accessibilityLabel={t('atRiskBadge') as string}
                  style={styles.alertBadge}
                >
                  <Ionicons name="alert" size={14} color={colors.card} />
                </View>
              )}
            </View>
          </View>
          <Pressable
            testID={`student-menu-${student.id}`}
            accessibilityRole="button"
            accessibilityLabel={t('studentActions') as string}
            onPress={onMenu}
            style={({ pressed }) => [styles.more, pressed && styles.pressed]}
          >
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.ink} />
          </Pressable>
        </View>
        <View style={styles.row}>
          <Pill style={styles.metric}>{t('ticksLabel')}</Pill>
          <Text style={styles.count}>
            {student.ticks}/{TICKS_FOR_MERIT}
          </Text>
          <ProgressBar value={student.ticks} max={TICKS_FOR_MERIT} color={colors.successGreen} />
        </View>
        <View style={styles.row}>
          <Pill style={styles.metric}>{t('crossesLabel')}</Pill>
          <Text style={styles.count}>
            {student.crosses}/{CROSSES_FOR_DETENTION}
          </Text>
          <ProgressBar value={student.crosses} max={CROSSES_FOR_DETENTION} color={colors.dangerRed} />
        </View>
        <View style={styles.badges}>
          <View style={styles.badgeRow}>
            <Sparkle />
            <Text style={styles.badge}>{t('meritsPlainPill', { count: student.merits })}</Text>
          </View>
          <View style={styles.badgeRow}>
            <Sparkle />
            <Text style={styles.badge}>{t('detentionsPlainPill', { count: student.detentions })}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export const StudentCard = memo(StudentCardBase);

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1.5, borderRadius: 20, padding: 16, marginBottom: 12 },
  washi: { position: 'absolute', top: -9, left: 24, width: 76, height: 22, borderRadius: 3, backgroundColor: colors.orange, opacity: 0.82, transform: [{ rotate: '-5deg' }] },
  pressed: { transform: [{ scale: 0.97 }] },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  nameBlock: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontFamily: 'PatrickHand_400Regular', fontSize: 23, color: colors.ink, lineHeight: 27 },
  alertBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.dangerRed,
    alignItems: 'center',
    justifyContent: 'center'
  },
  more: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  metric: { width: 70, textAlign: 'center' },
  count: { fontFamily: 'PatrickHand_400Regular', color: colors.ink, fontSize: 18, width: 38 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badge: { fontFamily: 'PatrickHand_400Regular', color: colors.ink, fontSize: 17 }
});
