import { NavigationContainer } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFonts, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { NunitoSans_400Regular, NunitoSans_600SemiBold, NunitoSans_700Bold, NunitoSans_800ExtraBold } from '@expo-google-fonts/nunito-sans';
import { initDatabase } from './database/db';
import { RootNavigator } from './navigation/RootNavigator';
import { colors } from './constants/colors';

export default function App() {
  const [ready, setReady] = useState(false);
  const [fontsLoaded] = useFonts({ Nunito_800ExtraBold, NunitoSans_400Regular, NunitoSans_600SemiBold, NunitoSans_700Bold, NunitoSans_800ExtraBold });
  useEffect(() => { initDatabase().then(() => setReady(true)); }, []);
  if (!ready || !fontsLoaded) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.offWhite }}><ActivityIndicator color={colors.primaryPink} /></View>;
  return <NavigationContainer><RootNavigator /></NavigationContainer>;
}
