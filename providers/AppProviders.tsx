import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { LanguageProvider, useT } from '../utils/i18n';
import { ReasonsProvider } from '../utils/reasons';
import { queryClient } from '../lib/queryClient';
import { AuthProvider } from './AuthContext';

const APP_NAME = 'Carnet Rose';

/**
 * Keeps the web <meta name="description"> in sync with the active language.
 * Renders nothing — it only touches the document head on web.
 */
const WebMeta = () => {
  const { t } = useT();
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', 'description');
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', t('metaDescription') as string);
  }, [t]);
  return null;
};

/**
 * The single composed provider tree for the app: server-state cache,
 * localisation, authentication session, and navigation. App.tsx renders this
 * once around RootNavigator; tests can compose the same pieces individually.
 */
export const AppProviders = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <ReasonsProvider>
        <AuthProvider>
          <NavigationContainer
            documentTitle={{
              // Each screen sets a localised `title`; surface it as
              // "<screen> · Carnet Rose" in the browser tab / history.
              formatter: (options, route) => {
                const title = options?.title ?? route?.name;
                return title ? `${title} · ${APP_NAME}` : APP_NAME;
              },
            }}
          >
            <WebMeta />
            {children}
          </NavigationContainer>
        </AuthProvider>
      </ReasonsProvider>
    </LanguageProvider>
  </QueryClientProvider>
);
