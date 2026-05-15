import { fireEvent, render, waitFor } from '../../test-utils/render';
import { StatisticsScreen } from '../../screens/StatisticsScreen';
import { getClassroomStatistics } from '../../domain/statisticsController';

jest.mock('../../domain/statisticsController', () => ({
  getClassroomStatistics: jest.fn(),
}));

const baseStats = {
  period: 'week',
  classId: null,
  hasData: true,
  classes: [
    { id: 'c10', name: '4e Rose' },
    { id: 'c20', name: '5e Bleu' },
  ],
  climate: {
    status: 'attention',
    tone: 'warning',
    label: 'À surveiller',
    recommendation: 'Prenez un moment avec les élèves à surveiller.',
  },
  today: { toWatch: 2, ticks: 5, crosses: 1, forgottenNotebooks: 1 },
  quickActions: {
    toWatch: [
      { id: 's5', firstName: 'Noah', lastName: 'Garcia', crosses: 3, meta: '3 croix en cours' },
    ],
    forgottenNotebooks: [],
    noRecentEvent: [{ id: 's2', firstName: 'Chloe', lastName: 'Durand', meta: 'Rien depuis 20 j' }],
  },
  top: {
    encourage: [{ id: 's3', firstName: 'Emma', lastName: 'Martin', meta: '2 mérites · 3 ticks' }],
    reframe: [{ id: 's1', firstName: 'Lucas', lastName: 'Petit', meta: '1 retenues · 3 croix' }],
  },
  evolution: { ticks: 12, crosses: 4, merits: 3, detentions: 1 },
  archives: [],
};

const makeNavigation = () => ({
  navigate: jest.fn(),
  canGoBack: jest.fn(() => false),
  goBack: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
});

beforeEach(() => {
  jest.clearAllMocks();
  getClassroomStatistics.mockResolvedValue(baseStats);
});

test('affiche le climat, le snapshot du jour et les sections', async () => {
  const { getByText, getByTestId } = render(<StatisticsScreen navigation={makeNavigation()} />);

  await waitFor(() => expect(getByText('Class climate')).toBeTruthy());
  expect(getByTestId('statistics-scroll')).toBeTruthy();
  expect(getByText('Class climate')).toBeTruthy();
  expect(getByText('Today')).toBeTruthy();
  expect(getByText('Quick action')).toBeTruthy();
  expect(getByText('Top 3')).toBeTruthy();
  expect(getByText('Progress')).toBeTruthy();
  expect(getByText('Ticks given')).toBeTruthy();
  expect(
    getByText('A little tension is building. Take a moment with the students to watch.'),
  ).toBeTruthy();
});

test('recharge les stats au changement de période', async () => {
  const { getByTestId, getByText } = render(<StatisticsScreen navigation={makeNavigation()} />);
  await waitFor(() => expect(getByText('Class climate')).toBeTruthy());

  fireEvent.press(getByTestId('period-trimester'));

  await waitFor(() =>
    expect(getClassroomStatistics).toHaveBeenLastCalledWith({ period: 'trimester', classId: null }),
  );
});

test('change la classe via le sélecteur', async () => {
  const { getByTestId, getByText } = render(<StatisticsScreen navigation={makeNavigation()} />);
  await waitFor(() => expect(getByText('Class climate')).toBeTruthy());

  fireEvent.press(getByTestId('class-dropdown'));
  fireEvent.press(getByTestId('class-option-c10'));

  await waitFor(() =>
    expect(getClassroomStatistics).toHaveBeenLastCalledWith({ period: 'week', classId: 'c10' }),
  );
});

test('bascule les onglets du Top 3', async () => {
  const { getByTestId, getByText, queryByText } = render(
    <StatisticsScreen navigation={makeNavigation()} />,
  );
  await waitFor(() => expect(getByText('MARTIN Emma')).toBeTruthy());

  fireEvent.press(getByTestId('top-reframe'));

  expect(getByText('PETIT Lucas')).toBeTruthy();
  expect(queryByText('MARTIN Emma')).toBeNull();
});

test('ouvre la fiche élève depuis une action rapide', async () => {
  const navigation = makeNavigation();
  const { getByText } = render(<StatisticsScreen navigation={navigation} />);
  await waitFor(() => expect(getByText('GARCIA Noah')).toBeTruthy());

  fireEvent.press(getByText('GARCIA Noah'));

  expect(navigation.navigate).toHaveBeenCalledWith('Classes', {
    screen: 'StudentDetail',
    params: { studentId: 's5' },
  });
});

test('affiche un état vide sans données', async () => {
  getClassroomStatistics.mockResolvedValue({ ...baseStats, hasData: false });
  const { getByText } = render(<StatisticsScreen navigation={makeNavigation()} />);

  await waitFor(() => expect(getByText('No statistics yet')).toBeTruthy());
});
