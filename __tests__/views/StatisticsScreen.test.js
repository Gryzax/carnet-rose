import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { StatisticsScreen } from '../../views/StatisticsScreen';
import { getStatistics } from '../../controllers/statisticsController';

jest.mock('../../controllers/statisticsController', () => ({
  getStatistics: jest.fn()
}));

const fullStats = {
  totals: { totalEleves: 5, totalMerites: 7, totalRetenues: 2, elevesARisque: 2 },
  classes: [
    { id: 1, nom: '4e Rose', nombreEleves: 3, totalMerites: 5, totalRetenues: 1, elevesARisque: 1 },
    { id: 2, nom: '5e Pivoine', nombreEleves: 2, totalMerites: 2, totalRetenues: 1, elevesARisque: 1 }
  ],
  topParticipatifs: [{ id: 1, prenom: 'Emma', nom: 'Martin', merites: 4, croix: 0, retenues: 0 }],
  topSurveillance: [{ id: 2, prenom: 'Lucas', nom: 'Petit', merites: 0, croix: 3, retenues: 1 }]
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
  getStatistics.mockResolvedValue(fullStats);
});

test('statistiques affiche titre, resume, graphique et tops', async () => {
  const { getAllByText, getByText, getByTestId } = render(<StatisticsScreen navigation={{ navigate: jest.fn(), canGoBack: jest.fn(() => false) }} />);

  await waitFor(() => expect(getByTestId('chart-legend')).toBeTruthy());

  expect(getByTestId('statistics-scroll').props.contentContainerStyle).toEqual(expect.objectContaining({ flexGrow: 1, paddingBottom: 116 }));
  expect(getByText('Statistiques')).toBeTruthy();
  expect(getByText("Vue d'ensemble du trimestre en cours")).toBeTruthy();
  expect(getByTestId('summary-grid')).toBeTruthy();
  expect(getByText('Total eleves')).toBeTruthy();
  expect(getByText('Total merites')).toBeTruthy();
  expect(getByText('Total retenues')).toBeTruthy();
  expect(getByText('A surveiller')).toBeTruthy();
  expect(getByText('Merites vs retenues par classe')).toBeTruthy();
  expect(getAllByText('Merites').length).toBeGreaterThan(0);
  expect(getAllByText('Retenues').length).toBeGreaterThan(0);
  expect(getByText('Top 3 participatifs')).toBeTruthy();
  expect(getByText('Emma Martin - 4 merites')).toBeTruthy();
  expect(getByText('Top 3 a surveiller')).toBeTruthy();
  expect(getByText('Lucas Petit - 3 croix - 1 retenues')).toBeTruthy();
  expect(getByText('Detail par classe')).toBeTruthy();
  expect(getByTestId('class-detail-1')).toBeTruthy();
  expect(getByText('Merites 5')).toBeTruthy();
  expect(getAllByText('Retenues 1').length).toBeGreaterThan(0);
});

test('statistiques affiche un etat vide propre', async () => {
  getStatistics.mockResolvedValueOnce({
    totals: { totalEleves: 0, totalMerites: 0, totalRetenues: 0, elevesARisque: 0 },
    classes: [],
    topParticipatifs: [],
    topSurveillance: []
  });
  const { getByText, queryByTestId } = render(<StatisticsScreen navigation={{ navigate: jest.fn(), canGoBack: jest.fn(() => false) }} />);

  await waitFor(() => expect(getByText('Pas encore de statistiques')).toBeTruthy());

  expect(getByText('Ajoutez des classes et des eleves pour commencer a suivre vos donnees.')).toBeTruthy();
  expect(queryByTestId('chart-legend')).toBeNull();
});

test('statistiques conserve des couleurs lisibles en mode sombre', async () => {
  jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
  const { getByText, getByTestId } = render(<StatisticsScreen navigation={{ navigate: jest.fn(), canGoBack: jest.fn(() => false) }} />);

  await waitFor(() => expect(getByTestId('summary-grid')).toBeTruthy());

  expect(getByText('Statistiques')).toBeTruthy();
  expect(getByTestId('summary-card-Total eleves').props.style).toEqual(expect.arrayContaining([expect.objectContaining({ backgroundColor: '#2D1520' })]));
});

test("statistiques affiche une fleche retour vers l'accueil", async () => {
  const navigation = { navigate: jest.fn(), canGoBack: jest.fn(() => false), goBack: jest.fn() };
  const { getByTestId } = render(<StatisticsScreen navigation={navigation} />);
  await waitFor(() => expect(getByTestId('back-button')).toBeTruthy());

  fireEvent.press(getByTestId('back-button'));

  expect(navigation.navigate).toHaveBeenCalledWith('Classes');
});
