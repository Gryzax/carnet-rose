import type { ReactElement, ReactNode } from 'react';
import { render as rtlRender, type RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../providers/AuthContext';

// A fresh client per render keeps test cases isolated, and `retry: false`
// makes a failing queryFn surface immediately instead of after backoff.
export const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      // gcTime: Infinity avoids the finite GC setTimeout that would otherwise
      // keep the Jest worker alive after the test finishes.
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity }
    }
  });

// Mirrors providers/AppProviders, minus NavigationContainer (screens under test
// receive a mock `navigation` prop directly).
const AllProviders = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    <AuthProvider>{children}</AuthProvider>
  </QueryClientProvider>
);

/** Drop-in replacement for testing-library's `render` that wires up app providers. */
export const render = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  rtlRender(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react-native';
