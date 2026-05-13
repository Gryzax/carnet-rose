import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { RootNavigator } from '../../navigation/RootNavigator';
import * as authService from '../../services/auth/authService';

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }) => {
      const { View } = require('react-native');
      return <View>{children}</View>;
    },
    Screen: ({ children, component: Component }) => (children ? children({}) : <Component />)
  })
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }) => {
      const { View } = require('react-native');
      return <View>{children}</View>;
    },
    Screen: ({ children, component: Component, name }) => {
      const { Text, View } = require('react-native');
      return (
        <View>
          <Text>{name}</Text>
          {children ? children({}) : <Component />}
        </View>
      );
    }
  })
}));

jest.mock('../../views/ClassesScreen', () => ({
  ClassesScreen: () => {
    const { Text } = require('react-native');
    return <Text>Classes screen</Text>;
  }
}));

jest.mock('../../views/ClassDashboardScreen', () => ({
  ClassDashboardScreen: () => {
    const { Text } = require('react-native');
    return <Text>Class dashboard</Text>;
  }
}));

jest.mock('../../views/StudentDetailScreen', () => ({
  StudentDetailScreen: () => {
    const { Text } = require('react-native');
    return <Text>Student detail</Text>;
  }
}));

jest.mock('../../views/StatisticsScreen', () => ({
  StatisticsScreen: () => {
    const { Text } = require('react-native');
    return <Text>Statistics screen</Text>;
  }
}));

jest.mock('../../views/SettingsScreen', () => ({
  SettingsScreen: ({ onSignedOut }) => {
    const { Text } = require('react-native');
    return <Text onPress={onSignedOut}>Settings screen</Text>;
  }
}));

jest.mock('../../services/api/supabaseClient', () => ({
  isSupabaseConfigured: jest.fn(() => false)
}));

jest.mock('../../services/auth/authService', () => ({
  enableLocalMode: jest.fn(() => Promise.resolve({ localModeEnabled: true, error: null })),
  getCurrentUser: jest.fn(() => Promise.resolve({ user: null, error: null })),
  isLocalModeEnabled: jest.fn(() => false),
  onAuthStateChange: jest.fn(() => ({ unsubscribe: jest.fn() })),
  signInWithApple: jest.fn(() => Promise.resolve({ user: null, message: 'Apple pending' })),
  signInWithGoogle: jest.fn(() => Promise.resolve({ user: null, message: 'Google pending' }))
}));

beforeEach(() => {
  jest.clearAllMocks();
  authService.getCurrentUser.mockResolvedValue({ user: null, error: null });
  authService.isLocalModeEnabled.mockReturnValue(false);
});

test('LoginScreen s affiche au lancement si non connecté', async () => {
  const { getByText } = render(<RootNavigator />);

  await waitFor(() => expect(getByText('Carnet Rose')).toBeTruthy());
});

test('après mode local, les tabs principales s affichent', async () => {
  const { getByTestId, getByText } = render(<RootNavigator />);
  await waitFor(() => expect(getByText('Carnet Rose')).toBeTruthy());

  await act(async () => {
    fireEvent.press(getByTestId('continue-local'));
  });

  await waitFor(() => expect(getByText('Classes')).toBeTruthy());
  expect(getByText('Statistiques')).toBeTruthy();
  expect(getByText('Parametres')).toBeTruthy();
});

test('si utilisateur déjà connecté, les tabs s affichent directement', async () => {
  authService.getCurrentUser.mockResolvedValueOnce({ user: { email: 'demo@example.com' }, error: null });

  const { getByText, queryByText } = render(<RootNavigator />);

  await waitFor(() => expect(getByText('Classes')).toBeTruthy());
  expect(queryByText('Carnet Rose')).toBeNull();
});

test('déconnexion depuis les paramètres renvoie au login', async () => {
  authService.getCurrentUser.mockResolvedValueOnce({ user: { email: 'demo@example.com' }, error: null });
  const { getByText } = render(<RootNavigator />);
  await waitFor(() => expect(getByText('Settings screen')).toBeTruthy());

  fireEvent.press(getByText('Settings screen'));

  await waitFor(() => expect(getByText('Carnet Rose')).toBeTruthy());
});
