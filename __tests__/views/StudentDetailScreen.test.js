import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StudentDetailScreen } from '../../views/StudentDetailScreen';

const student = { id: 1, prenom: 'Emma', nom: 'Martin', ticks: 0, croix: 0, merites: 0, retenues: 0, trimestreActuel: 1 };

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  }
}));

jest.mock('../../models/studentModel', () => ({
  getStudentById: jest.fn(() => Promise.resolve(student))
}));

jest.mock('../../hooks/useHistory', () => ({
  useHistory: jest.fn(() => ({ history: [], archives: [], refresh: jest.fn() }))
}));

jest.mock('../../controllers/studentController', () => ({
  ajouterTick: jest.fn((eleve) => Promise.resolve({ eleve: { ...eleve, ticks: 1 }, meritObtenu: false })),
  ajouterCroix: jest.fn((eleve) => Promise.resolve({ eleve: { ...eleve, croix: 1 }, retenueDeclenchee: false })),
  annulerDerniereAction: jest.fn(() => Promise.resolve({ annule: true }))
}));

import { ajouterTick } from '../../controllers/studentController';

test('detail eleve affiche toast apres tick', async () => {
  const { getByText } = render(<StudentDetailScreen route={{ params: { studentId: 1 } }} />);
  await waitFor(() => expect(getByText('Emma Martin')).toBeTruthy());
  fireEvent.press(getByText('TICK'));
  fireEvent.press(getByText('Participation'));
  await waitFor(() => expect(ajouterTick).toHaveBeenCalled());
  expect(getByText('Tick ajoute a Emma')).toBeTruthy();
});
