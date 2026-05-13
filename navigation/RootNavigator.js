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
    <Tabs.Screen name="Parametres" component={SettingsScreen} options={{ title: 'Paramètres' }} />
  </Tabs.Navigator>
);
