import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ClassDashboardScreen } from '../../views/ClassDashboardScreen';

const mockRefresh = jest.fn(() => Promise.resolve());
const student = { id: 1, prenom: 'Emma', nom: 'Martin', ticks: 0, croix: 2, merites: 0, retenues: 0 };

jest.mock('../../hooks/useStudents', () => ({
  useStudents: jest.fn(() => ({ students: [student], refresh: mockRefresh }))
}));

jest.mock('../../controllers/studentController', () => ({
  ajouterEleve: jest.fn(() => Promise.resolve({ lastInsertRowId: 2 })),
  supprimerEleve: jest.fn(() => Promise.resolve())
}));

jest.mock('../../controllers/classController', () => ({
  marquerClasseUtilisee: jest.fn(() => Promise.resolve())
}));

import { ajouterEleve, supprimerEleve } from '../../controllers/studentController';
import { marquerClasseUtilisee } from '../../controllers/classController';

beforeEach(() => jest.clearAllMocks());

test('suppression élève demande confirmation puis refresh', async () => {
  const { getByTestId, getByText } = render(<ClassDashboardScreen route={{ params: { classe: { id: 1, nom: '4e Rose' } } }} navigation={{ navigate: jest.fn() }} />);
  expect(getByTestId('class-dashboard-list').props.contentContainerStyle).toEqual(expect.objectContaining({ flexGrow: 1, paddingBottom: 116 }));
  fireEvent.press(getByTestId('delete-student-1'));
  expect(getByText("Supprimer l'élève")).toBeTruthy();
  fireEvent.press(getByTestId('confirm-delete-student'));
  await waitFor(() => expect(supprimerEleve).toHaveBeenCalledWith(student));
  expect(mockRefresh).toHaveBeenCalled();
});

test('flèche retour revient en arrière sur le tableau de bord classe', () => {
  const navigation = { navigate: jest.fn(), canGoBack: jest.fn(() => true), goBack: jest.fn() };
  const { getByTestId } = render(<ClassDashboardScreen route={{ params: { classe: { id: 1, nom: '4e Rose' } } }} navigation={navigation} />);

  fireEvent.press(getByTestId('back-button'));

  expect(navigation.goBack).toHaveBeenCalled();
});

test("annuler l'ajout d'élève ne crée pas d'élève", () => {
  const { getByText, getByPlaceholderText, getByTestId, queryByPlaceholderText } = render(<ClassDashboardScreen route={{ params: { classe: { id: 1, nom: '4e Rose' } } }} navigation={{ navigate: jest.fn(), canGoBack: jest.fn(() => false) }} />);

  fireEvent.press(getByText('Ajouter un élève'));
  fireEvent.changeText(getByPlaceholderText('Prénom'), 'Ada');
  fireEvent.changeText(getByPlaceholderText('Nom'), 'Lovelace');
  fireEvent.press(getByTestId('cancel-add-student'));

  expect(ajouterEleve).not.toHaveBeenCalled();
  expect(queryByPlaceholderText('Prénom')).toBeNull();
});
