import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';

export const getStudentInitials = (student) => `${student?.prenom?.[0] || ''}${student?.nom?.[0] || ''}`.toUpperCase();

export const getStudentAvatarColor = (student) => {
  if (student?.ticks >= 3) return colors.successGreen;
  if (student?.croix >= 3) return colors.dangerRed;
  if (student?.croix === 2) return colors.warningOrange;
  return colors.pink;
};

export const StudentAvatar = ({ student, size = 44 }) => (
  <View testID="student-avatar" style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: getStudentAvatarColor(student) }]}>
    <Text style={[styles.text, { fontSize: size >= 56 ? 23 : 17 }]}>{getStudentInitials(student)}</Text>
  </View>
);

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border },
  text: { color: colors.ink, fontFamily: 'PatrickHand_400Regular' }
});
