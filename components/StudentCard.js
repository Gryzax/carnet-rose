import React, { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { CROSSES_FOR_DETENTION, TICKS_FOR_MERIT } from '../constants/config';
import { ProgressBar } from './ProgressBar';

export const getStudentStateColor = (student) => {
  if (student.ticks >= 3) return colors.successGreen;
  if (student.croix >= 3) return colors.dangerRed;
  if (student.croix === 2) return colors.warningOrange;
  return colors.primaryPink;
};

const StudentCardBase = ({ student, onPress }) => {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [fade]);
  return (
    <Animated.View style={{ opacity: fade }}>
      <TouchableOpacity testID="student-card" onPress={onPress} style={[styles.card, { borderLeftColor: getStudentStateColor(student) }]}>
        <Text style={styles.name}>{student.nom.toUpperCase()} {student.prenom}</Text>
        <View style={styles.row}><Text style={styles.label}>Ticks {student.ticks}/{TICKS_FOR_MERIT}</Text><ProgressBar value={student.ticks} max={TICKS_FOR_MERIT} color={colors.successGreen} /></View>
        <View style={styles.row}><Text style={styles.label}>Croix {student.croix}/{CROSSES_FOR_DETENTION}</Text><ProgressBar value={student.croix} max={CROSSES_FOR_DETENTION} color={colors.dangerRed} /></View>
        <View style={styles.badges}><Text style={styles.badge}>Mérites {student.merites}</Text><Text style={styles.badgeWarn}>Retenues {student.retenues}</Text></View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const StudentCard = memo(StudentCardBase);

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 16, marginBottom: 12, borderLeftWidth: 6, shadowColor: colors.primaryPink, shadowOpacity: 0.16, shadowRadius: 10, elevation: 2 },
  name: { fontFamily: 'Nunito_800ExtraBold', fontSize: 17, color: colors.textDark, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  label: { width: 76, fontFamily: 'NunitoSans_600SemiBold', color: colors.textMuted, fontSize: 12 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badge: { backgroundColor: colors.lightPink, color: colors.deepPink, borderRadius: 50, paddingHorizontal: 12, paddingVertical: 5, overflow: 'hidden' },
  badgeWarn: { backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 5, overflow: 'hidden' }
});
