import { act, fireEvent, render, waitFor } from '../../test-utils/render';
import { StudentDetailScreen } from '../../screens/StudentDetailScreen';

const student = {
  id: 's1',
  firstName: 'Emma',
  lastName: 'Martin',
  ticks: 0,
  crosses: 0,
  merits: 0,
  detentions: 0,
  currentTrimester: 1,
};

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

jest.mock('../../hooks/useStudents', () => ({
  useStudent: jest.fn(() => ({ student, loading: false, refresh: jest.fn() })),
}));

jest.mock('../../hooks/useHistory', () => ({
  useHistory: jest.fn(() => ({ history: [], archives: [], refresh: jest.fn() })),
}));

jest.mock('../../components/ReasonSheet', () => ({
  ReasonSheet: ({ visible, reasons, onSelect }) => {
    const { Text, TouchableOpacity, View } = require('react-native');
    if (!visible) return null;
    return (
      <View>
        {reasons.map((reason) => (
          <TouchableOpacity key={reason} onPress={() => onSelect(reason)}>
            <Text>{reason}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  },
}));

jest.mock('../../components/UndoSnackbar', () => ({
  UndoSnackbar: ({ visible, message }) => {
    const { Text } = require('react-native');
    return visible ? <Text>{message}</Text> : null;
  },
}));

jest.mock('../../domain/studentController', () => ({
  addTick: jest.fn((student) =>
    Promise.resolve({ student: { ...student, ticks: 1 }, meritObtained: false }),
  ),
  addCross: jest.fn((student) =>
    Promise.resolve({ student: { ...student, crosses: 1 }, detentionTriggered: false }),
  ),
  undoLastAction: jest.fn(() => Promise.resolve({ cancelled: true, student })),
  deleteEvent: jest.fn(() => Promise.resolve()),
}));

import { addTick } from '../../domain/studentController';

beforeEach(() => jest.clearAllMocks());

test('détail élève affiche le toast après tick', async () => {
  const { getByTestId, getByText } = render(
    <StudentDetailScreen
      route={{ params: { studentId: 's1' } }}
      navigation={{ navigate: jest.fn(), canGoBack: jest.fn(() => false) }}
    />,
  );
  await waitFor(() => expect(getByText('Emma Martin')).toBeTruthy());
  expect(getByTestId('student-detail-list').props.contentContainerStyle).toEqual(
    expect.objectContaining({ flexGrow: 1, paddingBottom: 96 }),
  );
  fireEvent.press(getByText('TICK'));
  await waitFor(() => expect(getByText('Participation')).toBeTruthy());
  await act(async () => {
    fireEvent.press(getByText('Participation'));
  });
  await waitFor(() => expect(addTick).toHaveBeenCalled());
  expect(getByText('Tick added for Emma ⭐')).toBeTruthy();
});

test('détail élève affiche une flèche retour avec fallback accueil', async () => {
  const navigation = { navigate: jest.fn(), canGoBack: jest.fn(() => false), goBack: jest.fn() };
  const { getByTestId, getByText } = render(
    <StudentDetailScreen route={{ params: { studentId: 's1' } }} navigation={navigation} />,
  );

  await waitFor(() => expect(getByText('Emma Martin')).toBeTruthy());
  fireEvent.press(getByTestId('back-button'));

  expect(navigation.goBack).not.toHaveBeenCalled();
  expect(navigation.navigate).toHaveBeenCalledWith('ClassesHome');
});
