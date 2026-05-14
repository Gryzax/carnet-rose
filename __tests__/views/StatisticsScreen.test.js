import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StatisticsScreen } from '../../views/StatisticsScreen';

jest.mock('../../controllers/statisticsController', () => ({
  getStatistics: jest.fn(() => Promise.resolve({
    classes: [{ id: 1, nom: '4e Rose', totalMerites: 3, totalRetenues: 1 }],
    students: [
      { id: 1, classeId: 1, prenom: 'Emma', nom: 'Martin', ticks: 3, croix: 0, merites: 2, retenues: 0, trimestreActuel: 2 },
      { id: 2, classeId: 1, prenom: 'Lucas', nom: 'Petit', ticks: 0, croix: 3, merites: 0, retenues: 1, trimestreActuel: 2 }
    ],
    events: [
      { id: 10, eleveId: 1, type: 'tick', raison: 'Participation', creeLe: '2026-05-14T08:30:00.000Z', annule: 0 },
      { id: 11, eleveId: 2, type: 'croix', raison: 'Cahier oublié', creeLe: '2026-05-14T09:00:00.000Z', annule: 0 }
    ]
  }))
}));

test('statistiques affiche le tableau de bord actionnable', async () => {
  const { getByText, getByTestId } = render(<StatisticsScreen navigation={{ navigate: jest.fn(), canGoBack: jest.fn(() => false) }} />);
  await waitFor(() => expect(getByTestId('evolution-chart')).toBeTruthy());
  expect(getByTestId('statistics-scroll')).toBeTruthy();
  expect(getByTestId('statistics-scroll').props.contentContainerStyle).toEqual(expect.objectContaining({ flexGrow: 1, paddingBottom: 116 }));
  expect(getByText('Climat de classe')).toBeTruthy();
  expect(getByText("Aujourd'hui")).toBeTruthy();
  expect(getByText('Action rapide')).toBeTruthy();
  expect(getByText('Top 3')).toBeTruthy();
  expect(getByText('Évolution')).toBeTruthy();
});

test('statistiques permet de filtrer une classe et lancer une action rapide', async () => {
  const navigation = { navigate: jest.fn() };
  const { getByTestId, getByText } = render(<StatisticsScreen navigation={navigation} />);
  await waitFor(() => expect(getByTestId('class-dropdown')).toBeTruthy());

  fireEvent.press(getByTestId('class-dropdown'));
  fireEvent.press(getByText('4e Rose'));
  fireEvent.press(getByTestId('quick-watch'));

  expect(navigation.navigate).toHaveBeenCalledWith('ClassDashboard', { classe: expect.objectContaining({ id: 1, nom: '4e Rose' }) });
});
