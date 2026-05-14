import { Platform } from 'react-native';

// Network reachability.
//
// On web we can trust the browser's online/offline events. On native there is
// no such signal without an extra dependency, so we infer reachability from the
// outcome of the Supabase requests the app already makes: a network-level
// failure flips us offline, a success flips us back. Either way, when we
// transition offline -> online we notify listeners so the sync manager can
// drain the outbox ASAP.

type Listener = () => void;

let online = true;
const reconnectListeners = new Set<Listener>();

const setOnline = (next: boolean): void => {
  if (next === online) return;
  online = next;
  if (online) reconnectListeners.forEach((listener) => listener());
};

export const isOnline = (): boolean => online;

/** Called by the remote layer after a request succeeds. */
export const reportReachable = (): void => setOnline(true);

/** Called by the remote layer when a request fails at the network level. */
export const reportUnreachable = (): void => setOnline(false);

/** Subscribe to offline -> online transitions. Returns an unsubscribe fn. */
export const onReconnect = (listener: Listener): (() => void) => {
  reconnectListeners.add(listener);
  return () => reconnectListeners.delete(listener);
};

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  online = window.navigator?.onLine ?? true;
  window.addEventListener('online', () => setOnline(true));
  window.addEventListener('offline', () => setOnline(false));
}
