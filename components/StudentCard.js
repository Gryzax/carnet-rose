import React, { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { CROSSES_FOR_DETENTION, TICKS_FOR_MERIT } from '../constants/config';
import { ProgressBar } from './ProgressBar';
import { StudentAvatar, getStudentAvatarColor } from './StudentAvatar';
import { useThemeColors } from './Themed';

export const getStudentStateColor = (student) => getStudentAvatarColor(student);

const StudentCardBase = ({ student, onPress, onDelete }) => {
  const theme = useThemeColors();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [fade]);

  return (
    <Animated.View style={{ opacity: fade }}>
      <TouchableOpacity testID="student-card" onPress={onPress} onLongPress={onDelete} style={[styles.card, { backgroundColor: theme.card, borderLeftColor: getStudentStateColor(student) }]}>
        <View style={styles.header}>
          <StudentAvatar student={student} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text }]}>{student.nom.toUpperCase()} {student.prenom}</Text>
            <Text style={[styles.subtle, { color: theme.muted }]}>Appui long pour supprimer</Text>
          </View>
          <TouchableOpacity testID={`delete-student-${student.id}`} onPress={onDelete} style={styles.more}>
            <Text style={styles.moreText}>Options</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.muted }]}>Ticks {student.ticks}/{TICKS_FOR_MERIT}</Text>
          <ProgressBar value={student.ticks} max={TICKS_FOR_MERIT} color={colors.successGreen} />
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.muted }]}>Croix {student.croix}/{CROSSES_FOR_DETENTION}</Text>
          <ProgressBar value={student.croix} max={CROSSES_FOR_DETENTION} color={colors.dangerRed} />
        </View>
        <View style={styles.badges}>
          <Text style={styles.badge}>Mérites {student.merites}</Text>
          <Text style={styles.badgeWarn}>Retenues {student.retenues}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const StudentCard = memo(StudentCardBase);

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 16, marginBottom: 12, borderLeftWidth: 6, shadowColor: colors.primaryPink, shadowOpacity: 0.16, shadowRadius: 10, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  name: { fontFamily: 'Nunito_800ExtraBold', fontSize: 17 },
  subtle: { fontFamily: 'NunitoSans_400Regular', fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  label: { width: 76, fontFamily: 'NunitoSans_600SemiBold', fontSize: 12 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badge: { backgroundColor: colors.lightPink, color: colors.deepPink, borderRadius: 50, paddingHorizontal: 12, paddingVertical: 5, overflow: 'hidden', fontFamily: 'NunitoSans_700Bold' },
  badgeWarn: { backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 5, overflow: 'hidden', fontFamily: 'NunitoSans_700Bold' },
  more: { borderRadius: 50, backgroundColor: colors.lightPink, paddingHorizontal: 10, paddingVertical: 6 },
  moreText: { color: colors.deepPink, fontFamily: 'NunitoSans_700Bold', fontSize: 12 }
});
