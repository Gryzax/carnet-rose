import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../constants/colors';
import type { StudentRow } from '../types/domain';

export type StudentLike = Partial<StudentRow> | null | undefined;

export const getStudentInitials = (student: StudentLike): string =>
  `${student?.firstName?.[0] || ''}${student?.lastName?.[0] || ''}`.toUpperCase();

export const getStudentAvatarColor = (student: StudentLike): string => {
  if ((student?.ticks ?? 0) >= 3) return colors.successGreen;
  if ((student?.crosses ?? 0) >= 3) return colors.dangerRed;
  if (student?.crosses === 2) return colors.warningOrange;
  return colors.pink;
};

export interface StudentAvatarProps {
  student: StudentLike;
  size?: number;
}

export const StudentAvatar = ({ student, size = 44 }: StudentAvatarProps) => (
  <View
    testID="student-avatar"
    // Decorative: always rendered next to the student's name, and the colour
    // it encodes is also surfaced as text (pills / at-risk badge).
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    style={[
      styles.avatar,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: getStudentAvatarColor(student),
      },
    ]}
  >
    <Text style={[styles.text, { fontSize: size >= 56 ? 23 : 17 }]}>
      {getStudentInitials(student)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  text: { color: colors.onPrimary, fontFamily: typography.regular },
});
