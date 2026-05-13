import { NavigationContainer } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useFonts, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { NunitoSans_400Regular, NunitoSans_600SemiBold, NunitoSans_700Bold, NunitoSans_800ExtraBold } from '@expo-google-fonts/nunito-sans';
import { initDatabase } from './database/db';
import { RootNavigator } from './navigation/RootNavigator';
import { colors } from './constants/colors';

export default function App() {
  const [ready, setReady] = useState(false);
  const [fontsLoaded] = useFonts({ Nunito_800ExtraBold, NunitoSans_400Regular, NunitoSans_600SemiBold, NunitoSans_700Bold, NunitoSans_800ExtraBold });
  useEffect(() => {
    initDatabase().then(() => setReady(true));
    if (Platform.OS === 'web') {
      const baseUrl = window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname.replace(/\/[^/]*$/, '/');
      const manifest = document.createElement('link');
      manifest.rel = 'manifest';
      manifest.href = `${baseUrl}manifest.json`;
      document.head.appendChild(manifest);

      const appleCapable = document.createElement('meta');
      appleCapable.name = 'apple-mobile-web-app-capable';
      appleCapable.content = 'yes';
      document.head.appendChild(appleCapable);

      const appleTitle = document.createElement('meta');
      appleTitle.name = 'apple-mobile-web-app-title';
      appleTitle.content = 'Klassia';
      document.head.appendChild(appleTitle);

      const themeColor = document.createElement('meta');
      themeColor.name = 'theme-color';
      themeColor.content = '#DB2777';
      document.head.appendChild(themeColor);

      if ('serviceWorker' in navigator) navigator.serviceWorker.register(`${baseUrl}sw.js`).catch(() => {});
    }
  }, []);
  if (!ready || !fontsLoaded) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.offWhite }}><ActivityIndicator color={colors.primaryPink} /></View>;
  return <NavigationContainer><RootNavigator /></NavigationContainer>;
}
