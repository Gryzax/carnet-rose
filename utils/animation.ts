import { Platform } from 'react-native';

/**
 * The native animated module doesn't exist on web, so `useNativeDriver: true`
 * there only logs a warning and falls back to JS-based animation anyway. Use
 * this flag instead of a literal `true` so web silently runs the JS driver
 * while native keeps the real native driver.
 */
export const USE_NATIVE_DRIVER = Platform.OS !== 'web';
