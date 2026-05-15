import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography } from '../constants/colors';
import { useT } from '../utils/i18n';
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../constants/i18n';
import { WashiTape, type IoniconName } from '../components/Themed';
import type { AuthStackParamList } from '../navigation/types';

export type LandingScreenProps = NativeStackScreenProps<AuthStackParamList, 'Landing'>;

interface Feature {
  icon: IoniconName;
  titleKey:
    | 'landingFeature1Title'
    | 'landingFeature2Title'
    | 'landingFeature3Title'
    | 'landingFeature4Title';
  bodyKey:
    | 'landingFeature1Body'
    | 'landingFeature2Body'
    | 'landingFeature3Body'
    | 'landingFeature4Body';
}

// Light mode only — see DESIGN.md. Cozy peach canvas, white notebook cards,
// black ink borders, pink primary CTA. Shown only to signed-out visitors:
// RootNavigator swaps the whole AuthStack out once a user is present.
const FEATURES: Feature[] = [
  { icon: 'albums-outline', titleKey: 'landingFeature1Title', bodyKey: 'landingFeature1Body' },
  {
    icon: 'checkmark-circle-outline',
    titleKey: 'landingFeature2Title',
    bodyKey: 'landingFeature2Body',
  },
  { icon: 'time-outline', titleKey: 'landingFeature3Title', bodyKey: 'landingFeature3Body' },
  { icon: 'bar-chart-outline', titleKey: 'landingFeature4Title', bodyKey: 'landingFeature4Body' },
];

export const LandingScreen = ({ navigation }: LandingScreenProps) => {
  const { t, lang, setLang } = useT();
  const [langOpen, setLangOpen] = useState(false);

  return (
    <SafeAreaView style={styles.screen}>
      <WashiTape style={styles.washi} />

      {/* Corner language switcher — a fallback in case auto-detection got it wrong. */}
      <View style={styles.langSwitcher}>
        <Pressable
          testID="landing-language-dropdown"
          accessibilityRole="button"
          accessibilityState={{ expanded: langOpen }}
          accessibilityLabel={LANGUAGE_LABELS[lang]}
          onPress={() => setLangOpen((open) => !open)}
          style={({ pressed }) => [styles.langButton, pressed && styles.pressed]}
        >
          <Ionicons name="language" size={16} color={colors.ink} />
          <Text style={styles.langButtonText}>{lang.toUpperCase()}</Text>
          <Ionicons name={langOpen ? 'chevron-up' : 'chevron-down'} size={14} color={colors.ink} />
        </Pressable>
        {langOpen && (
          <View style={styles.langMenu}>
            {SUPPORTED_LANGUAGES.map((code) => {
              const active = code === lang;
              return (
                <Pressable
                  key={code}
                  testID={`landing-language-${code}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={LANGUAGE_LABELS[code]}
                  onPress={() => {
                    setLang(code);
                    setLangOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.langMenuRow,
                    active && styles.langMenuRowActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.langMenuText, active && styles.langMenuTextActive]}>
                    {LANGUAGE_LABELS[code]}
                  </Text>
                  {active && <Ionicons name="checkmark" size={16} color={colors.onPrimary} />}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logo}>
          <Ionicons name="heart" size={30} color={colors.pink} />
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          {t('appName')}
        </Text>
        <Text style={styles.headline}>{t('landingHeadline')}</Text>
        <Text style={styles.intro}>{t('landingIntro')}</Text>

        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature.titleKey} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={22} color={colors.ink} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{t(feature.titleKey)}</Text>
                <Text style={styles.featureBody}>{t(feature.bodyKey)}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.pricing}>{t('landingPricing')}</Text>

        <Pressable
          testID="landing-get-started"
          accessibilityRole="button"
          onPress={() => navigation.navigate('LoginScreen')}
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        >
          <Text style={styles.ctaText}>{t('landingCta')}</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.onPrimary} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const baseText = { fontFamily: typography.regular, color: colors.ink, letterSpacing: 0 };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  // Overrides the shared WashiTape default (top:14 right:-18) so the strip
  // clears the floating language switcher at the top-right.
  washi: { top: 64, right: -22, width: 148, height: 30 },
  langSwitcher: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    alignItems: 'flex-end',
    gap: 6,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1.5,
  },
  langButtonText: { ...baseText, fontSize: 16 },
  langMenu: {
    gap: 4,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 4,
    minWidth: 132,
  },
  langMenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  langMenuRowActive: { backgroundColor: colors.pink },
  langMenuText: { ...baseText, fontSize: 17 },
  langMenuTextActive: { color: colors.onPrimary },
  scroll: { flex: 1, backgroundColor: colors.canvas },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    paddingVertical: 24,
    gap: 12,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.border,
    borderWidth: 1.5,
  },
  title: { ...baseText, fontSize: 42, lineHeight: 48, textAlign: 'center' },
  headline: { ...baseText, fontSize: 26, lineHeight: 30, textAlign: 'center' },
  intro: { ...baseText, color: colors.muted, fontSize: 19, lineHeight: 24, textAlign: 'center' },
  features: { width: '100%', gap: 10, marginTop: 8 },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lightPink,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.border,
    borderWidth: 1.5,
  },
  featureText: { flex: 1, gap: 2 },
  featureTitle: { ...baseText, fontSize: 21, lineHeight: 25 },
  featureBody: { ...baseText, color: colors.muted, fontSize: 17, lineHeight: 22 },
  pricing: {
    ...baseText,
    color: colors.muted,
    fontSize: 17,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 4,
  },
  cta: {
    minHeight: 52,
    width: '100%',
    borderRadius: 8,
    borderColor: colors.border,
    borderWidth: 1.5,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  ctaText: { ...baseText, color: colors.onPrimary, fontSize: 22, textAlign: 'center' },
  pressed: { transform: [{ scale: 0.97 }] },
});
