import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ClassDashboardScreen } from '../../views/ClassDashboardScreen';

const mockRefresh = jest.fn(() => Promise.resolve());
const student = { id: 1, prenom: 'Emma', nom: 'Martin', ticks: 0, croix: 2, merites: 0, retenues: 0 };

jest.mock('../../hooks/useStudents', () => ({
  useStudents: jest.fn(() => ({ students: [student], refresh: mockRefresh }))
}));

jest.mock('../../controllers/studentController', () => ({
  supprimerEleve: jest.fn(() => Promise.resolve())
}));

import { supprimerEleve } from '../../controllers/studentController';

beforeEach(() => jest.clearAllMocks());

test('suppression élève demande confirmation puis refresh', async () => {
  const { getByTestId, getByText } = render(<ClassDashboardScreen route={{ params: { classe: { id: 1, nom: '4e Rose' } } }} navigation={{ navigate: jest.fn() }} />);
  fireEvent.press(getByTestId('delete-student-1'));
  expect(getByText("Supprimer l'élève")).toBeTruthy();
  fireEvent.press(getByTestId('confirm-delete-student'));
  await waitFor(() => expect(supprimerEleve).toHaveBeenCalledWith(student));
  expect(mockRefresh).toHaveBeenCalled();
});
