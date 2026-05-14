import { NavigationContainer } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useFonts } from 'expo-font';
import { PatrickHand_400Regular } from '@expo-google-fonts/patrick-hand';
import { initDatabase } from './database/db';
import { RootNavigator } from './navigation/RootNavigator';
import { colors } from './constants/colors';
import { LanguageProvider } from './utils/i18n';
import { getSupabaseUrl } from './services/supabase/supabaseClient';
import { startSyncManager } from './sync/syncManager';

export default function App() {
  const [ready, setReady] = useState(false);
  const [fontsLoaded] = useFonts({ PatrickHand_400Regular });
  useEffect(() => {
    initDatabase().then(() => {
      setReady(true);
      // Cache is ready: kick off the offline outbox + Supabase refresh loop.
      startSyncManager();
    });
    if (Platform.OS === 'web') {
      const baseUrl = window.location.pathname.endsWith('/')
        ? window.location.pathname
        : window.location.pathname.replace(/\/[^/]*$/, '/');

      // Content-Security-Policy: reduce the blast radius of any XSS (e.g. a
      // compromised dependency) that could otherwise read the stored session.
      if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
        const supabaseOrigin = (() => {
          try {
            return getSupabaseUrl() ? new URL(getSupabaseUrl()).origin : '';
          } catch {
            return '';
          }
        })();
        // The Expo dev server injects hot updates via eval(); a strict
        // script-src would break HMR. Relax it for dev only — production
        // builds never eval, so they keep the locked-down policy.
        const scriptSrc = __DEV__ ? "script-src 'self' 'unsafe-eval'" : "script-src 'self'";
        // Dev hot-reload also talks to the Metro websocket on the dev host.
        const connectSrc = __DEV__
          ? "connect-src 'self' ws: wss: http: https:"
          : `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ''}`;
        const csp = document.createElement('meta');
        csp.httpEquiv = 'Content-Security-Policy';
        csp.content = [
          "default-src 'self'",
          connectSrc,
          "img-src 'self' data: blob:",
          "style-src 'self' 'unsafe-inline'",
          scriptSrc,
          "object-src 'none'",
          "base-uri 'self'",
          "frame-ancestors 'none'"
        ].join('; ');
        document.head.appendChild(csp);
      }

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

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register(`${baseUrl}sw.js`).catch(() => {});
      }
    }
  }, []);
  if (!ready || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }}>
        <ActivityIndicator color={colors.orange} />
      </View>
    );
  }
  return (
    <LanguageProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </LanguageProvider>
  );
}
