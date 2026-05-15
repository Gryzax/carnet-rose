import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useFonts } from 'expo-font';
import { PatrickHand_400Regular } from '@expo-google-fonts/patrick-hand';
import { initDatabase } from './database/db';
import { RootNavigator } from './navigation/RootNavigator';
import { colors } from './constants/colors';
import { AppProviders } from './providers/AppProviders';
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
          // Note: `frame-ancestors` is intentionally omitted — it is ignored
          // when delivered via <meta> and must be set as an HTTP header by the
          // host (alongside X-Frame-Options) to actually prevent framing.
        ].join('; ');
        document.head.appendChild(csp);
      }
      // The manifest link, theme-color, apple-* meta tags and the service
      // worker registration now live in the static public/index.html so they
      // are present on first paint instead of after the bundle runs.
    }
  }, []);
  if (!ready || !fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.canvas,
        }}
      >
        <ActivityIndicator color={colors.orange} />
      </View>
    );
  }
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
