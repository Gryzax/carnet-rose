import { render, waitFor } from '@testing-library/react-native';
import { StatisticsScreen } from '../../views/StatisticsScreen';

jest.mock('react-native-gifted-charts', () => ({
  BarChart: 'BarChart'
}));

jest.mock('../../controllers/statisticsController', () => ({
  getStatistics: jest.fn(() => Promise.resolve({
    classes: [{ id: 1, nom: '4e Rose', totalMerites: 3, totalRetenues: 1 }],
    topParticipatifs: [{ id: 1, prenom: 'Emma', nom: 'Martin', merites: 2, croix: 0 }],
    topSurveillance: [{ id: 2, prenom: 'Lucas', nom: 'Petit', merites: 0, croix: 3 }]
  }))
}));

test('statistiques affiche legende et tops', async () => {
  const { getByText, getByTestId } = render(<StatisticsScreen />);
  await waitFor(() => expect(getByTestId('chart-legend')).toBeTruthy());
  expect(getByText(/Merites/)).toBeTruthy();
  expect(getByText(/Retenues/)).toBeTruthy();
  expect(getByText('Top 3 participatifs')).toBeTruthy();
  expect(getByText('Top 3 a surveiller')).toBeTruthy();
});
