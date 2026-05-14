import { Ionicons } from '@expo/vector-icons';
import { BottomTabBar, createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { colors } from '../constants/colors';
import { ClassesScreen } from '../views/ClassesScreen';
import { ClassDashboardScreen } from '../views/ClassDashboardScreen';
import { LoginScreen } from '../views/LoginScreen';
import { StudentDetailScreen } from '../views/StudentDetailScreen';
import { SettingsScreen } from '../views/SettingsScreen';
import { StatisticsScreen } from '../views/StatisticsScreen';
import { getCurrentUser, onAuthStateChange } from '../services/auth/authService';
import { useT } from '../utils/i18n';
import type { IoniconName } from '../components/Themed';
import type { AppTabsParamList, AuthStackParamList, ClassesStackParamList } from './types';
import type { AuthUser } from '../types/services';

const ClassesStackNav = createNativeStackNavigator<ClassesStackParamList>();
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const Tabs = createBottomTabNavigator<AppTabsParamList>();

const ClassesStack = () => (
  <ClassesStackNav.Navigator screenOptions={{ headerShown: false }}>
    <ClassesStackNav.Screen name="ClassesHome" component={ClassesScreen} />
    <ClassesStackNav.Screen name="ClassDashboard" component={ClassDashboardScreen} />
    <ClassesStackNav.Screen name="StudentDetail" component={StudentDetailScreen} />
  </ClassesStackNav.Navigator>
);

export interface AuthStackProps {
  onAuthenticated: (payload: { user: AuthUser }) => void;
}

export const AuthStack = ({ onAuthenticated }: AuthStackProps) => (
  <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
    <AuthStackNav.Screen name="LoginScreen">
      {() => <LoginScreen onAuthenticated={onAuthenticated} />}
    </AuthStackNav.Screen>
  </AuthStackNav.Navigator>
);

// Solid canvas-colored strip covering the bottom half of the floating tab
// bar down to the screen edge. Content can still slide behind the bar's
// opaque top half, but nothing peeks past its midline or through the gaps.
// Height = bottom offset (12) + half the bar height (68 / 2).
const AppTabBar = (props: BottomTabBarProps) => (
  <>
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 46, backgroundColor: colors.canvas }}
    />
    <BottomTabBar {...props} />
  </>
);

const TAB_ICONS: Record<keyof AppTabsParamList, IoniconName> = {
  Classes: 'albums-outline',
  Statistics: 'bar-chart-outline',
  Settings: 'settings-outline'
};

export interface AppTabsProps {
  onSignedOut: () => void;
}

export const AppTabs = ({ onSignedOut }: AppTabsProps) => {
  const { t } = useT();
  return (
    <Tabs.Navigator
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: 'PatrickHand_400Regular', fontSize: 14, lineHeight: 18, paddingBottom: 2 },
        tabBarItemStyle: { borderRadius: 999, marginVertical: 8 },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 12,
          backgroundColor: colors.white,
          borderColor: colors.border,
          borderTopColor: colors.border,
          borderWidth: 1.5,
          borderTopWidth: 1.5,
          borderRadius: 999,
          overflow: 'hidden',
          elevation: 2,
          shadowColor: colors.ink,
          shadowOpacity: 0.06,
          shadowRadius: 6,
          height: 68,
          paddingTop: 0,
          paddingBottom: 0
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
        )
      })}
    >
      <Tabs.Screen name="Classes" component={ClassesStack} options={{ title: t('tabClasses') as string }} />
      <Tabs.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{ title: t('tabStatistics') as string }}
      />
      <Tabs.Screen name="Settings" options={{ title: t('tabSettings') as string }}>
        {(props) => <SettingsScreen {...props} onSignedOut={onSignedOut} />}
      </Tabs.Screen>
    </Tabs.Navigator>
  );
};

export const RootNavigator = () => {
  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;
    const syncUserFromSession = () =>
      getCurrentUser().then(({ user }) => {
        if (!active) return;
        setUser(user || null);
        setCheckingSession(false);
      });
    syncUserFromSession();
    const subscription = onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    const handleBrowserBack = () => {
      syncUserFromSession();
    };
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('popstate', handleBrowserBack);
    }
    return () => {
      active = false;
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('popstate', handleBrowserBack);
      }
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

  if (!user) {
    return <AuthStack onAuthenticated={({ user }) => setUser(user)} />;
  }

  return <AppTabs onSignedOut={() => setUser(null)} />;
};
