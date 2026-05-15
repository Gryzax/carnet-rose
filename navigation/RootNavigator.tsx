import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  type LayoutChangeEvent,
  Pressable,
  View,
} from 'react-native';
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

const TAB_ICONS: Record<keyof AppTabsParamList, IoniconName> = {
  Classes: 'albums-outline',
  Statistics: 'bar-chart-outline',
  Settings: 'settings-outline',
};

// Custom tab bar with a single pink-soft indicator that slides between cells.
// Replaces React Navigation's BottomTabBar so we can share one moving layer
// across all tabs instead of toggling per-cell fills. Outer canvas strip
// preserves the visual seal between the floating bar and the screen edge.
const TAB_BAR_HEIGHT = 60;
const TAB_BAR_BOTTOM = 12;
const TAB_BAR_INSET = 16;
const INDICATOR_ANIM_MS = 220;

const AppTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const routeCount = state.routes.length;
  const [innerWidth, setInnerWidth] = useState(0);
  const cellWidth = innerWidth > 0 ? innerWidth / routeCount : 0;

  const indicatorX = useRef(new Animated.Value(0)).current;
  const hasLaidOutRef = useRef(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Per-tab focus value (0 = inactive, 1 = active). Drives icon color
  // cross-fade on the same curve as the indicator slide.
  const focusValues = useRef(
    state.routes.map((_, i) => new Animated.Value(i === state.index ? 1 : 0)),
  ).current;
  // Per-tab press scale.
  const pressValues = useRef(state.routes.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((flag) => {
      if (mounted) setReduceMotion(flag);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  // Slide indicator when active index changes. First layout snaps without
  // animation so the indicator appears under the initial tab.
  useEffect(() => {
    if (cellWidth === 0) return;
    const target = state.index * cellWidth;
    if (!hasLaidOutRef.current || reduceMotion) {
      indicatorX.setValue(target);
      hasLaidOutRef.current = true;
    } else {
      Animated.timing(indicatorX, {
        toValue: target,
        duration: INDICATOR_ANIM_MS,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start();
    }

    focusValues.forEach((value: Animated.Value, i) => {
      const focusTarget = i === state.index ? 1 : 0;
      if (reduceMotion) {
        value.setValue(focusTarget);
        return;
      }
      Animated.timing(value, {
        toValue: focusTarget,
        duration: INDICATOR_ANIM_MS,
        easing: Easing.out(Easing.exp),
        useNativeDriver: false,
      }).start();
    });
  }, [cellWidth, state.index, reduceMotion, indicatorX, focusValues]);

  const onBarLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w !== innerWidth) setInnerWidth(w);
  };

  return (
    <>
      {/* Solid canvas strip sealing the bottom edge behind the floating bar. */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: TAB_BAR_BOTTOM + TAB_BAR_HEIGHT / 2,
          backgroundColor: colors.canvas,
          pointerEvents: 'none',
        }}
      />
      <View
        onLayout={onBarLayout}
        style={{
          position: 'absolute',
          left: TAB_BAR_INSET,
          right: TAB_BAR_INSET,
          bottom: TAB_BAR_BOTTOM,
          height: TAB_BAR_HEIGHT,
          flexDirection: 'row',
          backgroundColor: colors.white,
          borderColor: colors.border,
          borderWidth: 1.5,
          borderRadius: 999,
          overflow: 'hidden',
          elevation: 2,
          boxShadow: `0px 0px 6px ${colors.ink}0F`,
        }}
      >
        {cellWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: cellWidth,
              backgroundColor: colors.lightPink,
              transform: [{ translateX: indicatorX }],
            }}
          />
        )}

        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const options = descriptors[route.key]?.options;
          const accessibilityLabel =
            options?.tabBarAccessibilityLabel ??
            (options?.title as string | undefined) ??
            route.name;
          const iconName = TAB_ICONS[route.name as keyof AppTabsParamList];
          const focusValue = focusValues[index]!;
          const pressValue = pressValues[index]!;

          const iconColor = focusValue.interpolate({
            inputRange: [0, 1],
            outputRange: [colors.muted, colors.ink],
          });

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          const pressIn = () => {
            Animated.timing(pressValue, {
              toValue: 0.97,
              duration: 90,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }).start();
          };

          const pressOut = () => {
            Animated.timing(pressValue, {
              toValue: 1,
              duration: 140,
              easing: Easing.out(Easing.exp),
              useNativeDriver: true,
            }).start();
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={accessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              onPressIn={pressIn}
              onPressOut={pressOut}
              style={{ flex: 1 }}
            >
              <Animated.View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ scale: pressValue }],
                }}
              >
                <AnimatedIonicon name={iconName} size={24} color={iconColor} />
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </>
  );
};

// Ionicons isn't an Animated component out of the box. Wrap once so the icon
// color can ride the focus interpolation without re-rendering every frame.
const AnimatedIonicon = Animated.createAnimatedComponent(Ionicons);

export interface AppTabsProps {
  onSignedOut: () => void;
}

export const AppTabs = ({ onSignedOut }: AppTabsProps) => {
  const { t } = useT();
  return (
    <Tabs.Navigator
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="Classes"
        component={ClassesStack}
        options={{ title: t('tabClasses') as string }}
      />
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
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.canvas,
        }}
      >
        <ActivityIndicator color={colors.deepPink} />
      </View>
    );
  }

  if (!user) {
    return <AuthStack onAuthenticated={({ user }) => setUser(user)} />;
  }

  return <AppTabs onSignedOut={() => setUser(null)} />;
};
