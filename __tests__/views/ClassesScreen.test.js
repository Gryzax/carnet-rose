import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ClassesScreen } from '../../views/ClassesScreen';

const mockRefresh = jest.fn(() => Promise.resolve());
let mockClasses = [];

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

jest.mock('../../hooks/useClasses', () => ({
  useClasses: jest.fn(() => ({
    classes: mockClasses,
    loading: false,
    refresh: mockRefresh
  }))
}));

jest.mock('../../controllers/classController', () => ({
  ajouterClasse: jest.fn(() => Promise.resolve({ lastInsertRowId: 3 })),
  supprimerClasse: jest.fn(() => Promise.resolve())
}));

jest.mock('../../models/studentModel', () => ({
  getAllStudents: jest.fn(() => Promise.resolve([]))
}));

import { ajouterClasse, supprimerClasse } from '../../controllers/classController';

beforeEach(() => {
  jest.clearAllMocks();
  mockClasses = [];
});

test("le FAB ouvre la modale d'ajout de classe", () => {
  const { getByTestId, getByPlaceholderText } = render(<ClassesScreen navigation={{ navigate: jest.fn() }} />);

  fireEvent.press(getByTestId('add-class-fab'));

  expect(getByPlaceholderText('Nom de la classe')).toBeTruthy();
});

test('la modale ajoute une classe puis rafraîchit la liste', async () => {
  const { getByTestId, getByPlaceholderText, getByText } = render(<ClassesScreen navigation={{ navigate: jest.fn() }} />);

  fireEvent.press(getByTestId('add-class-fab'));
  fireEvent.changeText(getByPlaceholderText('Nom de la classe'), '4e Rose');
  fireEvent.press(getByText('Ajouter'));

  await waitFor(() => expect(ajouterClasse).toHaveBeenCalledWith('4e Rose'));
  expect(mockRefresh).toHaveBeenCalled();
});

test('la modale bloque un nom vide', () => {
  const { getByTestId, getByText } = render(<ClassesScreen navigation={{ navigate: jest.fn() }} />);

  fireEvent.press(getByTestId('add-class-fab'));
  fireEvent.press(getByText('Ajouter'));

  expect(getByText('Le nom de la classe est obligatoire.')).toBeTruthy();
  expect(ajouterClasse).not.toHaveBeenCalled();
});

test('la corbeille ouvre la confirmation de suppression', () => {
  mockClasses = [{ id: 7, nom: '4e Rose', nombreEleves: 2, totalMerites: 0, totalRetenues: 0 }];
  const { getAllByText, getByTestId, getByText } = render(<ClassesScreen navigation={{ navigate: jest.fn() }} />);

  fireEvent.press(getByTestId('delete-class-7'));

  expect(getByText('Supprimer la classe')).toBeTruthy();
  expect(getAllByText('4e Rose').length).toBeGreaterThan(1);
  expect(getByText('Les élèves de cette classe, leur historique et leurs archives trimestrielles seront supprimés définitivement.')).toBeTruthy();
});

test('Annuler ne supprime pas la classe', () => {
  mockClasses = [{ id: 7, nom: '4e Rose', nombreEleves: 2, totalMerites: 0, totalRetenues: 0 }];
  const { getByTestId, queryByText } = render(<ClassesScreen navigation={{ navigate: jest.fn() }} />);

  fireEvent.press(getByTestId('delete-class-7'));
  fireEvent.press(getByTestId('cancel-delete-class'));

  expect(supprimerClasse).not.toHaveBeenCalled();
  expect(queryByText('Supprimer la classe')).toBeNull();
});

test('Supprimer supprime la classe puis rafraichit la liste', async () => {
  const classe = { id: 7, nom: '4e Rose', nombreEleves: 2, totalMerites: 0, totalRetenues: 0 };
  mockClasses = [classe];
  const { getByTestId } = render(<ClassesScreen navigation={{ navigate: jest.fn() }} />);

  fireEvent.press(getByTestId('delete-class-7'));
  fireEvent.press(getByTestId('confirm-delete-class'));

  await waitFor(() => expect(supprimerClasse).toHaveBeenCalledWith(classe));
  expect(mockRefresh).toHaveBeenCalled();
});
