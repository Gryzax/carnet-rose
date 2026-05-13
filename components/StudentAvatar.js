import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';

export const getStudentInitials = (student) => `${student?.prenom?.[0] || ''}${student?.nom?.[0] || ''}`.toUpperCase();

export const getStudentAvatarColor = (student) => {
  if (student?.ticks >= 3) return colors.successGreen;
  if (student?.croix >= 3) return colors.dangerRed;
  if (student?.croix === 2) return colors.warningOrange;
  return colors.primaryPink;
};

export const StudentAvatar = ({ student, size = 40 }) => (
  <View testID="student-avatar" style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: getStudentAvatarColor(student) }]}>
    <Text style={[styles.text, { fontSize: size >= 56 ? 20 : 14 }]}>{getStudentInitials(student)}</Text>
  </View>
);

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.white, fontFamily: 'Nunito_800ExtraBold' }
});
