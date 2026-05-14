import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { signInWithApple, signInWithGoogle } from '../services/auth/authService';
import { isSupabaseConfigured } from '../services/supabase/supabaseClient';

const unavailableMessage = 'La connexion n\u2019est pas encore configur\u00e9e. Veuillez contacter l\u2019administrateur.';

const paletteFor = (scheme) => {
  const dark = scheme === 'dark';
  return {
    canvas: dark ? colors.darkBg : colors.canvas,
    card: dark ? colors.darkCard : colors.card,
    text: dark ? colors.white : colors.ink,
    muted: dark ? '#F9A8D4' : colors.muted,
    border: dark ? '#6D2746' : colors.softPink,
    notice: dark ? '#3B1828' : colors.lightPink
  };
};

const LoginButton = ({ children, icon, onPress, disabled, testID, primary, palette }) => (
  <Pressable
    testID={testID}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [
      styles.button,
      { backgroundColor: primary ? colors.pink : palette.card, borderColor: palette.border },
      disabled && styles.disabled,
      pressed && !disabled && styles.pressed
    ]}
  >
    <Ionicons name={icon} size={20} color={primary ? colors.ink : palette.text} />
    <Text style={[styles.buttonText, { color: primary ? colors.ink : palette.text }]}>{children}</Text>
  </Pressable>
);

export const LoginScreen = ({ onAuthenticated }) => {
  const [loading, setLoading] = useState('');
  const [message, setMessage] = useState('');
  const { width } = useWindowDimensions();
  const scheme = useColorScheme();
  const palette = useMemo(() => paletteFor(scheme), [scheme]);
  const compact = width < 380;
  const supabaseReady = isSupabaseConfigured();

  const runAuth = async (provider) => {
    if (!supabaseReady) {
      setMessage(unavailableMessage);
      return;
    }
    setLoading(provider);
    const result = provider === 'apple' ? await signInWithApple() : await signInWithGoogle();
    setLoading('');
    if (result.user) {
      onAuthenticated?.({ user: result.user });
      return;
    }
    setMessage(result.message || result.error?.message || 'Connexion impossible pour le moment.');
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.canvas }]}>
      <View style={styles.wrap}>
        <View style={[styles.card, compact && styles.cardCompact, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.logo}>
            <Ionicons name="heart" size={30} color={colors.deepPink} />
          </View>
          <Text style={styles.title}>Carnet Rose</Text>
          <Text style={[styles.subtitle, { color: palette.text }]}>Suivi hors ligne des eleves</Text>
          <Text style={[styles.reassure, { color: palette.muted }]}>Vos donnees restent disponibles hors ligne.</Text>
          {!supabaseReady && (
            <View testID="auth-unavailable-notice" style={[styles.notice, { backgroundColor: palette.notice, borderColor: palette.border }]}>
              <Text style={styles.noticeTitle}>Connexion indisponible</Text>
              <Text style={[styles.noticeText, { color: palette.muted }]}>{unavailableMessage}</Text>
            </View>
          )}
          <LoginButton testID="login-google" disabled={Boolean(loading)} onPress={() => runAuth('google')} icon="logo-google" primary palette={palette}>
            {loading === 'google' ? 'Connexion...' : 'Continuer avec Google'}
          </LoginButton>
          <LoginButton testID="login-apple" disabled={Boolean(loading)} onPress={() => runAuth('apple')} icon="logo-apple" palette={palette}>
            {loading === 'apple' ? 'Connexion...' : 'Continuer avec Apple'}
          </LoginButton>
          {!!loading && <ActivityIndicator color={colors.deepPink} />}
          {!!message && <Text testID="login-message" style={styles.message}>{message}</Text>}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 460, borderRadius: 20, borderWidth: 1.5, padding: 20, gap: 12 },
  cardCompact: { padding: 14 },
  logo: { alignSelf: 'center', width: 58, height: 58, borderRadius: 29, backgroundColor: colors.lightPink, alignItems: 'center', justifyContent: 'center', borderColor: colors.softPink, borderWidth: 1.5 },
  title: { fontFamily: 'PatrickHand_400Regular', color: colors.deepPink, fontSize: 42, lineHeight: 48, textAlign: 'center' },
  subtitle: { fontFamily: 'PatrickHand_400Regular', fontSize: 24, textAlign: 'center' },
  reassure: { fontFamily: 'PatrickHand_400Regular', fontSize: 19, lineHeight: 24, textAlign: 'center' },
  notice: { borderWidth: 1.5, borderRadius: 8, padding: 12, gap: 4 },
  noticeTitle: { fontFamily: 'PatrickHand_400Regular', color: colors.deepPink, fontSize: 21 },
  noticeText: { fontFamily: 'PatrickHand_400Regular', fontSize: 18, lineHeight: 23 },
  button: { minHeight: 50, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  buttonText: { fontFamily: 'PatrickHand_400Regular', fontSize: 20, textAlign: 'center' },
  disabled: { opacity: 0.55 },
  pressed: { transform: [{ scale: 0.98 }] },
  message: { fontFamily: 'PatrickHand_400Regular', color: colors.deepPink, fontSize: 18, lineHeight: 23, textAlign: 'center' }
});
