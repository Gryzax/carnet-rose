import { render } from '@testing-library/react-native';
import { colors } from '../../constants/colors';
import { ProgressBar } from '../../components/ProgressBar';
import { StudentAvatar, getStudentInitials } from '../../components/StudentAvatar';
import { StudentCard, getStudentStateColor } from '../../components/StudentCard';

const student = {
  id: 1,
  firstName: 'Emma',
  lastName: 'Martin',
  ticks: 1,
  crosses: 0,
  merits: 2,
  detentions: 1,
};

test('rendu de StudentCard', () => {
  const { getByText } = render(<StudentCard student={student} />);
  expect(getByText('MARTIN Emma')).toBeTruthy();
  expect(getByText('Merits 2')).toBeTruthy();
  expect(getByText('Detentions 1')).toBeTruthy();
});

test('avatar initiales', () => {
  // StudentAvatar is decorative and hidden from the accessibility tree, so
  // its testID is only reachable with includeHiddenElements.
  const { getByText, getByTestId } = render(<StudentAvatar student={student} />);
  expect(getByTestId('student-avatar', { includeHiddenElements: true })).toBeTruthy();
  expect(getByText('EM', { includeHiddenElements: true })).toBeTruthy();
  expect(getStudentInitials(student)).toBe('EM');
});

test('couleurs selon etat', () => {
  expect(getStudentStateColor({ ticks: 3, crosses: 0 })).toBe(colors.successGreen);
  expect(getStudentStateColor({ ticks: 0, crosses: 3 })).toBe(colors.dangerRed);
  expect(getStudentStateColor({ ticks: 0, crosses: 2 })).toBe(colors.warningOrange);
  expect(getStudentStateColor({ ticks: 0, crosses: 0 })).toBe(colors.primaryPink);
});

test('progress bars', () => {
  // Without a `label` the bar is decorative and hidden from the a11y tree.
  const { getByTestId } = render(<ProgressBar value={2} max={4} color={colors.primaryPink} />);
  expect(getByTestId('progress-track', { includeHiddenElements: true })).toBeTruthy();
  expect(getByTestId('progress-fill', { includeHiddenElements: true })).toBeTruthy();
});

test('progress bar with label is exposed to screen readers', () => {
  const { getByRole } = render(
    <ProgressBar value={2} max={4} color={colors.primaryPink} label="Ticks 2/4" />,
  );
  const bar = getByRole('progressbar');
  expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 4, now: 2 });
});
