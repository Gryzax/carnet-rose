import { Ionicons } from '@expo/vector-icons';
import { BottomTabBar, createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { ClassesScreen } from '../screens/ClassesScreen';
import { ClassDashboardScreen } from '../screens/ClassDashboardScreen';
import { LandingScreen } from '../screens/LandingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { StudentDetailScreen } from '../screens/StudentDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { StatisticsScreen } from '../screens/StatisticsScreen';
import { useAuth } from '../providers/AuthContext';
import { useT } from '../utils/i18n';
import type { IoniconName } from '../components/Themed';
import type { AppTabsParamList, AuthStackParamList, ClassesStackParamList } from './types';
import type { AuthUser } from '../types/services';

const ClassesStackNav = createNativeStackNavigator<ClassesStackParamList>();
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const Tabs = createBottomTabNavigator<AppTabsParamList>();

const ClassesStack = () => {
  const { t } = useT();
  return (
    <ClassesStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ClassesStackNav.Screen
        name="ClassesHome"
        component={ClassesScreen}
        options={{ title: t('classesTitle') as string }}
      />
      <ClassesStackNav.Screen
        name="ClassDashboard"
        component={ClassDashboardScreen}
        options={({ route }) => ({ title: route.params.classRow.name })}
      />
      <ClassesStackNav.Screen
        name="StudentDetail"
        component={StudentDetailScreen}
        options={{ title: t('studentDetailTitle') as string }}
      />
    </ClassesStackNav.Navigator>
  );
};

export interface AuthStackProps {
  onAuthenticated: (payload: { user: AuthUser }) => void;
}

export const AuthStack = ({ onAuthenticated }: AuthStackProps) => {
  const { t } = useT();
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Landing" component={LandingScreen} />
      <AuthStackNav.Screen name="LoginScreen" options={{ title: t('loginTitle') as string }}>
        {() => <LoginScreen onAuthenticated={onAuthenticated} />}
      </AuthStackNav.Screen>
    </AuthStackNav.Navigator>
  );
};

// Solid canvas-colored strip covering the bottom half of the floating tab
// bar down to the screen edge. Content can still slide behind the bar's
// opaque top half, but nothing peeks past its midline or through the gaps.
// Height = bottom offset (12) + half the bar height (80 / 2).
const AppTabBar = (props: BottomTabBarProps) => (
  <>
    <View
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 52, backgroundColor: colors.canvas, pointerEvents: 'none' }}
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

const TAB_LABEL_KEYS: Record<keyof AppTabsParamList, 'tabClasses' | 'tabStatistics' | 'tabSettings'> = {
  Classes: 'tabClasses',
  Statistics: 'tabStatistics',
  Settings: 'tabSettings'
};

export const AppTabs = ({ onSignedOut }: AppTabsProps) => {
  const { t } = useT();
  return (
    <Tabs.Navigator
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        // Render the label ourselves: react-native-web puts `overflow: hidden`
        // on the default (numberOfLines={1}) label, which clips PatrickHand's
        // deep descenders (the "g" in "Réglages"). A plain Text has no clip.
        tabBarLabel: ({ color }) => (
          <Text
            style={{
              fontFamily: 'PatrickHand_400Regular',
              fontSize: 14,
              lineHeight: 26,
              color
            }}
          >
            {t(TAB_LABEL_KEYS[route.name]) as string}
          </Text>
        ),
        tabBarItemStyle: { borderRadius: 999, marginVertical: 8, paddingVertical: 4 },
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
          boxShadow: `0px 0px 6px ${colors.ink}0F`,
          height: 80,
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
  const { user, checkingSession, setUser } = useAuth();

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
