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
      tabBarActiveTintColor: colors.ink,
      tabBarInactiveTintColor: colors.muted,
      tabBarLabelStyle: { fontFamily: 'PatrickHand_400Regular', fontSize: 15 },
      tabBarStyle: { backgroundColor: colors.canvas, borderTopWidth: 0, elevation: 0, height: 64, paddingTop: 6 },
      tabBarIcon: ({ color, size }) => {
        const icons = { Classes: 'basket-outline', Statistiques: 'restaurant-outline', Parametres: 'grid-outline' };
        return <Ionicons name={icons[route.name]} size={size} color={color} />;
      }
    })}
  >
    <Tabs.Screen name="Classes" component={ClassesStack} options={{ title: 'Compra' }} />
    <Tabs.Screen name="Statistiques" component={StatisticsScreen} options={{ title: 'Recetas' }} />
    <Tabs.Screen name="Parametres" component={SettingsScreen} options={{ title: 'Mas' }} />
  </Tabs.Navigator>
);
