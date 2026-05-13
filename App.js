import { NavigationContainer } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useFonts } from 'expo-font';
import { PatrickHand_400Regular } from '@expo-google-fonts/patrick-hand';
import { initDatabase } from './database/db';
import { RootNavigator } from './navigation/RootNavigator';
import { colors } from './constants/colors';

export default function App() {
  const [ready, setReady] = useState(false);
  const [fontsLoaded] = useFonts({ PatrickHand_400Regular });
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
      appleTitle.content = 'Carnet Rose';
      document.head.appendChild(appleTitle);

      const themeColor = document.createElement('meta');
      themeColor.name = 'theme-color';
      themeColor.content = colors.canvas;
      document.head.appendChild(themeColor);

      if ('serviceWorker' in navigator) navigator.serviceWorker.register(`${baseUrl}sw.js`).catch(() => {});
    }
  }, []);
  if (!ready || !fontsLoaded) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }}><ActivityIndicator color={colors.orange} /></View>;
  return <NavigationContainer><RootNavigator /></NavigationContainer>;
}
