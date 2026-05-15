import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../constants/colors';
import {
  consumePendingAuthError,
  getCurrentUser,
  signInWithApple,
  signInWithGoogle,
} from '../services/auth/authService';
import { isSupabaseConfigured } from '../services/supabase/supabaseClient';
import { useT } from '../utils/i18n';
import { WashiTape, type IoniconName } from '../components/Themed';
import type { AuthUser } from '../types/services';

export interface LoginScreenProps {
  onAuthenticated?: (payload: { user: AuthUser }) => void;
}

interface LoginButtonProps {
  children: ReactNode;
  icon: IoniconName;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  primary?: boolean;
}

// Light mode only — see DESIGN.md. Cozy peach canvas, white notebook card,
// black ink borders, pink primary CTA, sage secondary action.
const LoginButton = ({ children, icon, onPress, disabled, testID, primary }: LoginButtonProps) => (
  <Pressable
    testID={testID}
    disabled={disabled}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ disabled: Boolean(disabled) }}
    style={({ pressed }) => [
      styles.button,
      primary ? styles.buttonPrimary : styles.buttonSecondary,
      disabled && styles.disabled,
      pressed && !disabled && styles.pressed,
    ]}
  >
    <Ionicons name={icon} size={20} color={primary ? colors.onPrimary : colors.ink} />
    <Text style={[styles.buttonText, primary && styles.buttonTextPrimary]}>{children}</Text>
  </Pressable>
);

export const LoginScreen = ({ onAuthenticated }: LoginScreenProps) => {
  const { t } = useT();
  const unavailableMessage = t('unavailableMessage') as string;
  const [loading, setLoading] = useState('');
  const [message, setMessage] = useState('');
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const supabaseReady = isSupabaseConfigured();

  useEffect(() => {
    let active = true;
    getCurrentUser().then(({ user }) => {
      if (!active) return;
      // Surface any OAuth error carried back in the redirect, so a failed
      // provider sign-in explains itself instead of silently showing login.
      const authError = consumePendingAuthError();
      if (authError) setMessage(authError);
      if (!user) return;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + window.location.search,
        );
      }
      onAuthenticated?.({ user });
    });
    return () => {
      active = false;
    };
  }, [onAuthenticated]);

  const runAuth = async (provider: 'google' | 'apple') => {
    if (!supabaseReady) {
      setMessage(unavailableMessage);
      return;
    }
    setLoading(provider);
    const result = provider === 'apple' ? await signInWithApple() : await signInWithGoogle();
    setLoading('');
    if (result.user) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + window.location.search,
        );
      }
      onAuthenticated?.({ user: result.user });
      return;
    }
    setMessage(t(result.messageKey || 'connectionFailed') as string);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <WashiTape style={styles.washi} />
      <View style={styles.wrap}>
        <View style={[styles.card, compact && styles.cardCompact]}>
          <View style={styles.logo}>
            <Ionicons name="heart" size={26} color={colors.pink} />
          </View>
          <Text style={styles.brand}>{t('appName')}</Text>
          <Text accessibilityRole="header" style={styles.prompt}>
            {t('loginPrompt')}
          </Text>
          {!supabaseReady && (
            <View testID="auth-unavailable-notice" style={styles.notice}>
              <Text style={styles.noticeTitle}>{t('connectionUnavailable')}</Text>
              <Text style={styles.noticeText}>{unavailableMessage}</Text>
            </View>
          )}
          <LoginButton
            testID="login-google"
            disabled={Boolean(loading)}
            onPress={() => runAuth('google')}
            icon="logo-google"
            primary
          >
            {loading === 'google' ? t('connecting') : t('continueGoogle')}
          </LoginButton>
          <LoginButton
            testID="login-apple"
            disabled={Boolean(loading)}
            onPress={() => runAuth('apple')}
            icon="logo-apple"
          >
            {loading === 'apple' ? t('connecting') : t('continueApple')}
          </LoginButton>
          {!!loading && <ActivityIndicator color={colors.ink} />}
          {!!message && (
            <Text testID="login-message" style={styles.message}>
              {message}
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const baseText = { fontFamily: typography.regular, color: colors.ink, letterSpacing: 0 };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  // Overrides the shared WashiTape default (top:14) so it clears the top
  // edge of the auth card.
  washi: { top: 64, right: -22, width: 148, height: 30 },
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  cardCompact: { padding: 14 },
  logo: {
    alignSelf: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.border,
    borderWidth: 1.5,
  },
  brand: { ...baseText, fontSize: 30, lineHeight: 34, textAlign: 'center', color: colors.pink },
  prompt: { ...baseText, fontSize: 24, lineHeight: 28, textAlign: 'center' },
  notice: {
    backgroundColor: colors.lightPink,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  noticeTitle: { ...baseText, fontSize: 21 },
  noticeText: { ...baseText, color: colors.muted, fontSize: 18, lineHeight: 23 },
  button: {
    minHeight: 50,
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonPrimary: { backgroundColor: colors.pink },
  buttonSecondary: { backgroundColor: colors.sage },
  buttonText: { ...baseText, fontSize: 20, textAlign: 'center' },
  buttonTextPrimary: { color: colors.onPrimary },
  disabled: { opacity: 0.55 },
  pressed: { transform: [{ scale: 0.97 }] },
  message: { ...baseText, fontSize: 18, lineHeight: 23, textAlign: 'center' },
});
