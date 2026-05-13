import React, { memo, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { CROSSES_FOR_DETENTION, TICKS_FOR_MERIT } from '../constants/config';
import { ProgressBar } from './ProgressBar';
import { StudentAvatar, getStudentAvatarColor } from './StudentAvatar';
import { Pill, Sparkle } from './Themed';

export const getStudentStateColor = (student) => getStudentAvatarColor(student);

const StudentCardBase = ({ student, onPress, onDelete }) => {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [fade]);

  return (
    <Animated.View style={{ opacity: fade }}>
      <Pressable testID="student-card" onPress={onPress} onLongPress={onDelete} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={styles.washi} />
        <View style={styles.header}>
          <StudentAvatar student={student} />
          <View style={styles.nameBlock}>
            <Text style={styles.name}>{student.nom.toUpperCase()} {student.prenom}</Text>
            <Text style={styles.subtle}>Appui long pour supprimer</Text>
          </View>
          <Pressable testID={`delete-student-${student.id}`} onPress={onDelete} style={({ pressed }) => [styles.more, pressed && styles.pressed]}>
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.ink} />
          </Pressable>
        </View>
        <View style={styles.row}>
          <Pill style={styles.metric}>TICKS</Pill>
          <Text style={styles.count}>{student.ticks}/{TICKS_FOR_MERIT}</Text>
          <ProgressBar value={student.ticks} max={TICKS_FOR_MERIT} color={colors.successGreen} />
        </View>
        <View style={styles.row}>
          <Pill style={styles.metric}>CROIX</Pill>
          <Text style={styles.count}>{student.croix}/{CROSSES_FOR_DETENTION}</Text>
          <ProgressBar value={student.croix} max={CROSSES_FOR_DETENTION} color={colors.dangerRed} />
        </View>
        <View style={styles.badges}>
          <View style={styles.badgeRow}><Sparkle /><Text style={styles.badge}>Mérites {student.merites}</Text></View>
          <View style={styles.badgeRow}><Sparkle /><Text style={styles.badge}>Retenues {student.retenues}</Text></View>
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
  name: { fontFamily: 'PatrickHand_400Regular', fontSize: 23, color: colors.ink, lineHeight: 27 },
  subtle: { fontFamily: 'PatrickHand_400Regular', fontSize: 16, color: colors.muted, marginTop: 1 },
  more: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  metric: { width: 70, textAlign: 'center' },
  count: { fontFamily: 'PatrickHand_400Regular', color: colors.ink, fontSize: 18, width: 38 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badge: { fontFamily: 'PatrickHand_400Regular', color: colors.ink, fontSize: 17 }
});
