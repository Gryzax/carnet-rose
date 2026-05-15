import { fireEvent, render, waitFor } from '../../test-utils/render';
import { ClassesScreen } from '../../screens/ClassesScreen';

const mockRefresh = jest.fn(() => Promise.resolve());
let mockClasses = [];

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../../hooks/useClasses', () => ({
  useClasses: jest.fn(() => ({
    classes: mockClasses,
    loading: false,
    refresh: mockRefresh,
  })),
}));

jest.mock('../../hooks/useStudents', () => ({
  useAllStudents: jest.fn(() => ({ students: [], loading: false, refresh: jest.fn() })),
}));

jest.mock('../../domain/classService', () => ({
  addClass: jest.fn(() => Promise.resolve({ id: 'c3', name: '4e Rose' })),
  markClassUsed: jest.fn(() => Promise.resolve()),
  deleteClass: jest.fn(() => Promise.resolve()),
  updateClass: jest.fn((classRow, name) => Promise.resolve({ ...classRow, name })),
}));

import { addClass, markClassUsed, deleteClass, updateClass } from '../../domain/classService';

beforeEach(() => {
  jest.clearAllMocks();
  mockClasses = [];
});

test("le FAB ouvre la modale d'ajout de classe", () => {
  const { getByTestId, getByPlaceholderText } = render(
    <ClassesScreen navigation={{ navigate: jest.fn() }} />,
  );

  fireEvent.press(getByTestId('add-class-fab'));

  expect(getByPlaceholderText('Class name')).toBeTruthy();
});

test('base vide affiche un EmptyState propre sans classes demo', () => {
  const { getByTestId, getByText, queryByText } = render(
    <ClassesScreen navigation={{ navigate: jest.fn() }} />,
  );

  expect(getByTestId('classes-list')).toBeTruthy();
  expect(getByTestId('classes-list').props.contentContainerStyle).toEqual(
    expect.objectContaining({ flexGrow: 1, paddingBottom: 96 }),
  );
  expect(getByText('No classes yet')).toBeTruthy();
  expect(queryByText('5e Pivoine')).toBeNull();
  expect(queryByText('6e Rose')).toBeNull();
});

test('la modale ajoute une classe', async () => {
  const { getByTestId, getByPlaceholderText, getByText } = render(
    <ClassesScreen navigation={{ navigate: jest.fn() }} />,
  );

  fireEvent.press(getByTestId('add-class-fab'));
  fireEvent.changeText(getByPlaceholderText('Class name'), '4e Rose');
  fireEvent.press(getByText('Add'));

  await waitFor(() => expect(addClass).toHaveBeenCalledWith('4e Rose'));
});

test('la modale bloque un nom vide', () => {
  const { getByTestId, getByText } = render(<ClassesScreen navigation={{ navigate: jest.fn() }} />);

  fireEvent.press(getByTestId('add-class-fab'));
  fireEvent.press(getByText('Add'));

  expect(getByText('Please give the class a name.')).toBeTruthy();
  expect(addClass).not.toHaveBeenCalled();
});

test("Annuler l'ajout de classe ne crée pas de classe", () => {
  const { getByTestId, getByPlaceholderText, getByText, queryByPlaceholderText } = render(
    <ClassesScreen navigation={{ navigate: jest.fn() }} />,
  );

  fireEvent.press(getByTestId('add-class-fab'));
  fireEvent.changeText(getByPlaceholderText('Class name'), '3e Rose');
  fireEvent.press(getByText('Cancel'));

  expect(addClass).not.toHaveBeenCalled();
  expect(queryByPlaceholderText('Class name')).toBeNull();
});

test('le menu ouvre la confirmation de suppression', () => {
  mockClasses = [
    { id: 'c7', name: '4e Rose', studentCount: 2, totalMerits: 0, totalDetentions: 0 },
  ];
  const { getAllByText, getByTestId, getByText } = render(
    <ClassesScreen navigation={{ navigate: jest.fn() }} />,
  );

  fireEvent.press(getByTestId('class-menu-c7'));
  fireEvent.press(getByTestId('menu-delete-class'));

  expect(getByText('Delete class')).toBeTruthy();
  expect(getAllByText('4e Rose').length).toBeGreaterThan(1);
  expect(
    getByText(
      'This class, its students, their history and term archives will be permanently deleted.',
    ),
  ).toBeTruthy();
});

test('Annuler ne supprime pas la classe', () => {
  mockClasses = [
    { id: 'c7', name: '4e Rose', studentCount: 2, totalMerits: 0, totalDetentions: 0 },
  ];
  const { getByTestId, queryByText } = render(
    <ClassesScreen navigation={{ navigate: jest.fn() }} />,
  );

  fireEvent.press(getByTestId('class-menu-c7'));
  fireEvent.press(getByTestId('menu-delete-class'));
  fireEvent.press(getByTestId('cancel-delete-class'));

  expect(deleteClass).not.toHaveBeenCalled();
  expect(queryByText('Delete class')).toBeNull();
});

test('Supprimer supprime la classe', async () => {
  const classRow = {
    id: 'c7',
    name: '4e Rose',
    studentCount: 2,
    totalMerits: 0,
    totalDetentions: 0,
  };
  mockClasses = [classRow];
  const { getByTestId } = render(<ClassesScreen navigation={{ navigate: jest.fn() }} />);

  fireEvent.press(getByTestId('class-menu-c7'));
  fireEvent.press(getByTestId('menu-delete-class'));
  fireEvent.press(getByTestId('confirm-delete-class'));

  await waitFor(() => expect(deleteClass).toHaveBeenCalledWith(classRow));
});

test('le menu permet de renommer la classe', async () => {
  const classRow = {
    id: 'c7',
    name: '4e Rose',
    studentCount: 2,
    totalMerits: 0,
    totalDetentions: 0,
  };
  mockClasses = [classRow];
  const { getByTestId, getByDisplayValue, getByText } = render(
    <ClassesScreen navigation={{ navigate: jest.fn() }} />,
  );

  fireEvent.press(getByTestId('class-menu-c7'));
  fireEvent.press(getByTestId('menu-edit-class'));
  fireEvent.changeText(getByDisplayValue('4e Rose'), '4e Pivoine');
  fireEvent.press(getByText('Save'));

  await waitFor(() => expect(updateClass).toHaveBeenCalledWith(classRow, '4e Pivoine'));
});

test('ouvrir une classe marque son utilisation recente', async () => {
  const classRow = {
    id: 'c7',
    name: '4e Rose',
    studentCount: 2,
    totalMerits: 0,
    totalDetentions: 0,
  };
  const navigation = { navigate: jest.fn() };
  mockClasses = [classRow];
  const { getByText } = render(<ClassesScreen navigation={navigation} />);

  fireEvent.press(getByText('4e Rose'));

  await waitFor(() => expect(markClassUsed).toHaveBeenCalledWith(classRow));
  expect(navigation.navigate).toHaveBeenCalledWith('ClassDashboard', { classRow });
});
