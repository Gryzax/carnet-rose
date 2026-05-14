import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { RootNavigator } from '../../navigation/RootNavigator';
import * as authService from '../../services/auth/authService';

let mockAuthCallback;
const originalPlatformOS = Platform.OS;

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

jest.mock('../../services/supabase/supabaseClient', () => ({
  isSupabaseConfigured: jest.fn(() => false)
}));

jest.mock('../../services/auth/authService', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({ user: null, error: null })),
  onAuthStateChange: jest.fn((callback) => {
    mockAuthCallback = callback;
    return { unsubscribe: jest.fn() };
  }),
  signOut: jest.fn(() => Promise.resolve({ error: null })),
  signInWithApple: jest.fn(() => Promise.resolve({ user: null, message: 'Apple pending' })),
  signInWithGoogle: jest.fn(() => Promise.resolve({ user: null, message: 'Google pending' }))
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthCallback = null;
  authService.getCurrentUser.mockResolvedValue({ user: null, error: null });
});

afterEach(() => {
  Platform.OS = originalPlatformOS;
  jest.restoreAllMocks();
});

test('aucun acces aux tabs sans session', async () => {
  const { getByText, queryByText } = render(<RootNavigator />);

  await waitFor(() => expect(getByText('Carnet Rose')).toBeTruthy());
  expect(queryByText('Classes')).toBeNull();
});

test('acces aux tabs avec utilisateur mocke', async () => {
  authService.getCurrentUser.mockResolvedValueOnce({ user: { email: 'demo@example.com' }, error: null });

  const { getByText, queryByText } = render(<RootNavigator />);

  await waitFor(() => expect(getByText('Classes')).toBeTruthy());
  expect(getByText('Statistiques')).toBeTruthy();
  expect(getByText('Parametres')).toBeTruthy();
  expect(queryByText('Carnet Rose')).toBeNull();
});

test('apres login auth, les tabs principales remplacent le login', async () => {
  const { getByText, queryByText } = render(<RootNavigator />);
  await waitFor(() => expect(getByText('Carnet Rose')).toBeTruthy());

  act(() => {
    mockAuthCallback('SIGNED_IN', { user: { email: 'demo@example.com' } });
  });

  await waitFor(() => expect(getByText('Classes')).toBeTruthy());
  expect(queryByText('Carnet Rose')).toBeNull();
});

test('retour navigateur simule ne declenche pas signOut si une session existe', async () => {
  Platform.OS = 'web';
  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;
  let popstateHandler;
  window.addEventListener = jest.fn((event, handler) => {
    if (event === 'popstate') popstateHandler = handler;
  });
  window.removeEventListener = jest.fn();
  authService.getCurrentUser.mockResolvedValue({ user: { email: 'demo@example.com' }, error: null });
  const { getByText } = render(<RootNavigator />);
  await waitFor(() => expect(getByText('Classes')).toBeTruthy());

  popstateHandler();

  await waitFor(() => expect(authService.getCurrentUser).toHaveBeenCalledTimes(2));
  expect(authService.signOut).not.toHaveBeenCalled();
  window.addEventListener = originalAddEventListener;
  window.removeEventListener = originalRemoveEventListener;
});

test('signOut renvoie vers LoginScreen', async () => {
  authService.getCurrentUser.mockResolvedValueOnce({ user: { email: 'demo@example.com' }, error: null });
  const { getByText } = render(<RootNavigator />);
  await waitFor(() => expect(getByText('Settings screen')).toBeTruthy());

  fireEvent.press(getByText('Settings screen'));

  await waitFor(() => expect(getByText('Carnet Rose')).toBeTruthy());
});
