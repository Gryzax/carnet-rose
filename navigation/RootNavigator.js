import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../constants/colors';
import { ClassesScreen } from '../views/ClassesScreen';
import { ClassDashboardScreen } from '../views/ClassDashboardScreen';
import { LoginScreen } from '../views/LoginScreen';
import { StudentDetailScreen } from '../views/StudentDetailScreen';
import { SettingsScreen } from '../views/SettingsScreen';
import { StatisticsScreen } from '../views/StatisticsScreen';
import { getCurrentUser, isLocalModeEnabled, onAuthStateChange } from '../services/auth/authService';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const ClassesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ClassesHome" component={ClassesScreen} />
    <Stack.Screen name="ClassDashboard" component={ClassDashboardScreen} />
    <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
  </Stack.Navigator>
);

export const AuthStack = ({ onAuthenticated }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="LoginScreen">
      {(props) => <LoginScreen {...props} onAuthenticated={onAuthenticated} />}
    </Stack.Screen>
  </Stack.Navigator>
);

export const AppTabs = ({ onSignedOut }) => (
  <Tabs.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.deepPink,
      tabBarInactiveTintColor: colors.muted,
      tabBarLabelStyle: { fontFamily: 'PatrickHand_400Regular', fontSize: 14 },
      tabBarItemStyle: { borderRadius: 999, marginVertical: 6 },
      tabBarStyle: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 12,
        backgroundColor: colors.white,
        borderColor: colors.softPink,
        borderWidth: 1.5,
        borderTopWidth: 1.5,
        borderRadius: 999,
        elevation: 8,
        shadowColor: colors.deepPink,
        shadowOpacity: 0.12,
        shadowRadius: 12,
        height: 64,
        paddingTop: 6,
        paddingBottom: 8
      },
      tabBarIcon: ({ color, size }) => {
        const icons = { Classes: 'albums-outline', Statistiques: 'bar-chart-outline', Parametres: 'settings-outline' };
        return <Ionicons name={icons[route.name]} size={size} color={color} />;
      }
    })}
  >
    <Tabs.Screen name="Classes" component={ClassesStack} options={{ title: 'Classes' }} />
    <Tabs.Screen name="Statistiques" component={StatisticsScreen} options={{ title: 'Statistiques' }} />
    <Tabs.Screen name="Parametres" options={{ title: 'Paramètres' }}>
      {(props) => <SettingsScreen {...props} onSignedOut={onSignedOut} />}
    </Tabs.Screen>
  </Tabs.Navigator>
);

export const RootNavigator = () => {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authState, setAuthState] = useState({ user: null, localMode: false });

  useEffect(() => {
    let active = true;
    getCurrentUser().then(({ user }) => {
      if (!active) return;
      setAuthState({ user, localMode: isLocalModeEnabled() });
      setCheckingSession(false);
    });
    const subscription = onAuthStateChange((_event, session) => {
      setAuthState({ user: session?.user || null, localMode: isLocalModeEnabled() });
    });
    return () => {
      active = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  if (checkingSession) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }}>
        <ActivityIndicator color={colors.deepPink} />
      </View>
    );
  }

  if (!authState.user && !authState.localMode) {
    return <AuthStack onAuthenticated={({ user, localMode }) => setAuthState({ user, localMode })} />;
  }

  return <AppTabs onSignedOut={() => setAuthState({ user: null, localMode: false })} />;
};
