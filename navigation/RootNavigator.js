import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import { ClassesScreen } from '../views/ClassesScreen';
import { ClassDashboardScreen } from '../views/ClassDashboardScreen';
import { StudentDetailScreen } from '../views/StudentDetailScreen';
import { SettingsScreen } from '../views/SettingsScreen';
import { StatisticsScreen } from '../views/StatisticsScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const ClassesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ClassesHome" component={ClassesScreen} />
    <Stack.Screen name="ClassDashboard" component={ClassDashboardScreen} />
    <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
  </Stack.Navigator>
);

export const RootNavigator = () => (
  <Tabs.Navigator screenOptions={({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: colors.deepPink,
    tabBarInactiveTintColor: colors.textMuted,
    tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.lightPink },
    tabBarIcon: ({ color, size }) => {
      const icons = { Classes: 'school-outline', Statistiques: 'bar-chart-outline', Parametres: 'settings-outline' };
      return <Ionicons name={icons[route.name]} size={size} color={color} />;
    }
  })}>
    <Tabs.Screen name="Classes" component={ClassesStack} options={{ title: 'Classes' }} />
    <Tabs.Screen name="Statistiques" component={StatisticsScreen} />
    <Tabs.Screen name="Parametres" component={SettingsScreen} options={{ title: 'Paramètres' }} />
  </Tabs.Navigator>
);
