import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ClassDashboardScreen } from '../../views/ClassDashboardScreen';

const mockRefresh = jest.fn(() => Promise.resolve());
const student = { id: 's1', firstName: 'Emma', lastName: 'Martin', ticks: 0, crosses: 2, merits: 0, detentions: 0 };

jest.mock('../../hooks/useStudents', () => ({
  useStudents: jest.fn(() => ({ students: [student], refresh: mockRefresh }))
}));

jest.mock('../../controllers/studentController', () => ({
  addStudent: jest.fn(() => Promise.resolve({ lastInsertRowId: 2 })),
  deleteStudent: jest.fn(() => Promise.resolve()),
  updateStudent: jest.fn(() => Promise.resolve())
}));

jest.mock('../../controllers/classController', () => ({
  markClassUsed: jest.fn(() => Promise.resolve())
}));

import { addStudent, deleteStudent, updateStudent } from '../../controllers/studentController';
import { markClassUsed } from '../../controllers/classController';

beforeEach(() => jest.clearAllMocks());

test('suppression élève demande confirmation', async () => {
  const { getByTestId, getByText } = render(<ClassDashboardScreen route={{ params: { classRow: { id: 'c1', name: '4e Rose' } } }} navigation={{ navigate: jest.fn() }} />);
  expect(getByTestId('class-dashboard-list').props.contentContainerStyle).toEqual(expect.objectContaining({ flexGrow: 1, paddingBottom: 148 }));
  fireEvent.press(getByTestId('student-menu-s1'));
  fireEvent.press(getByTestId('menu-delete-student'));
  expect(getByText('Delete student')).toBeTruthy();
  fireEvent.press(getByTestId('confirm-delete-student'));
  await waitFor(() => expect(deleteStudent).toHaveBeenCalledWith(student));
});

test('modifier un élève via le menu', async () => {
  const { getByTestId, getByText, getByDisplayValue } = render(<ClassDashboardScreen route={{ params: { classRow: { id: 'c1', name: '4e Rose' } } }} navigation={{ navigate: jest.fn() }} />);
  fireEvent.press(getByTestId('student-menu-s1'));
  fireEvent.press(getByTestId('menu-edit-student'));
  expect(getByText('Edit student')).toBeTruthy();
  fireEvent.changeText(getByDisplayValue('Emma'), 'Emmanuelle');
  fireEvent.press(getByTestId('confirm-edit-student'));
  await waitFor(() =>
    expect(updateStudent).toHaveBeenCalledWith(student, { firstName: 'Emmanuelle', lastName: 'Martin' })
  );
});

test('flèche retour revient en arrière sur le tableau de bord classe', () => {
  const navigation = { navigate: jest.fn(), canGoBack: jest.fn(() => true), goBack: jest.fn() };
  const { getByTestId } = render(<ClassDashboardScreen route={{ params: { classRow: { id: 'c1', name: '4e Rose' } } }} navigation={navigation} />);

  fireEvent.press(getByTestId('back-button'));

  expect(navigation.goBack).toHaveBeenCalled();
});

test("annuler l'ajout d'élève ne crée pas d'élève", () => {
  const { getByText, getByPlaceholderText, getByTestId, queryByPlaceholderText } = render(<ClassDashboardScreen route={{ params: { classRow: { id: 'c1', name: '4e Rose' } } }} navigation={{ navigate: jest.fn(), canGoBack: jest.fn(() => false) }} />);

  fireEvent.press(getByText('Add a student'));
  fireEvent.changeText(getByPlaceholderText('First name'), 'Ada');
  fireEvent.changeText(getByPlaceholderText('Last name'), 'Lovelace');
  fireEvent.press(getByTestId('cancel-add-student'));

  expect(addStudent).not.toHaveBeenCalled();
  expect(queryByPlaceholderText('First name')).toBeNull();
});
