import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { colors, typography } from '../constants/colors';
import { resetTrimester, type ResetTrimesterResult } from '../domain/studentService';
import { getAllStudents } from '../models/studentModel';
import {
  Card,
  InfoIcon,
  JournalInput,
  Pill,
  PillButton,
  Screen,
  Sparkle,
  Title,
  WashiTape,
} from '../components/Themed';
import { ReasonsEditor } from '../components/ReasonsEditor';
import { DialogModal, DialogTitle } from '../components/ConfirmDialog';
import { deleteAccount, getCurrentUser, signOut } from '../services/auth/authService';
import { clearLocalData } from '../database/db';
import { invalidate } from '../lib/queryClient';
import { useT } from '../utils/i18n';
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../constants/i18n';
import type { AppTabsParamList } from '../navigation/types';
import type { AuthUser } from '../types/services';

interface TrimesterSummary {
  totalMerits: number;
  totalDetentions: number;
  totalStudents: number;
  trimester: number;
}

export interface SettingsScreenProps {
  navigation: BottomTabNavigationProp<AppTabsParamList, 'Settings'>;
  onSignedOut?: () => void;
}

const Section = ({ title, children }: { title: ReactNode; children: ReactNode }) => (
  <Card washi>
    <Pill accessibilityRole="header">{title}</Pill>
    <View style={styles.sectionBody}>{children}</View>
  </Card>
);

export const SettingsScreen = ({ onSignedOut }: SettingsScreenProps) => {
  const { t, lang, setLang } = useT();
  const [summary, setSummary] = useState<TrimesterSummary | null>(null);
  const [success, setSuccess] = useState<ResetTrimesterResult | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getCurrentUser().then(({ user }) => {
      if (active) setUser(user);
    });
    return () => {
      active = false;
    };
  }, []);

  const prepare = async () => {
    const students = await getAllStudents();
    setConfirmText('');
    setSummary({
      totalMerits: students.reduce((s, e) => s + e.merits, 0),
      totalDetentions: students.reduce((s, e) => s + e.detentions, 0),
      totalStudents: students.length,
      trimester: students[0]?.currentTrimester || 1,
    });
  };

  const confirmWord = t('confirmWord') as string;

  const confirm = async () => {
    if (!summary || confirmText !== confirmWord) return;
    const res = await resetTrimester(summary.trimester);
    setSummary(null);
    setSuccess(res);
  };

  const disconnect = async () => {
    await signOut();
    setUser(null);
    onSignedOut?.();
  };

  const deleteWord = t('deleteAccountWord') as string;

  const openDelete = () => {
    setDeleteText('');
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteText !== deleteWord) return;
    const { error } = await deleteAccount();
    if (error) {
      setDeleteError(t('deleteAccountError') as string);
      return;
    }
    // Account is gone remotely — wipe the local cache so nothing lingers
    // on the device, then refresh every screen's data.
    await clearLocalData();
    invalidate('classes', 'students', 'events');
    setDeleteOpen(false);
    setUser(null);
    onSignedOut?.();
  };

  const userName = (user?.user_metadata as { name?: string } | undefined)?.name;

  return (
    <Screen>
      <ScrollView
        testID="settings-scroll"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <WashiTape />
        <Title>{t('settingsTitle')}</Title>
        <Section title={t('sectionData')}>
          <PillButton onPress={prepare} variant="orange">
            {t('endTrimester')}
          </PillButton>
          {success && (
            <View style={styles.success}>
              <Sparkle />
              <Text style={styles.text}>
                {t('trimesterArchived', {
                  students: success.totalStudents,
                  merits: success.totalMerits,
                  detentions: success.totalDetentions,
                })}
              </Text>
            </View>
          )}
        </Section>
        <Section title={t('sectionPreferences')}>
          <Text style={styles.muted}>{t('languageHint')}</Text>
          <Pressable
            testID="language-dropdown"
            accessibilityRole="button"
            accessibilityState={{ expanded: langOpen }}
            accessibilityLabel={LANGUAGE_LABELS[lang]}
            onPress={() => setLangOpen((open) => !open)}
            style={({ pressed }) => [styles.languageRow, pressed && styles.pressed]}
          >
            <Text style={styles.languageLabel}>{LANGUAGE_LABELS[lang]}</Text>
            <Ionicons
              name={langOpen ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.ink}
            />
          </Pressable>
          {langOpen && (
            <View style={styles.languageMenu}>
              {SUPPORTED_LANGUAGES.map((code) => {
                const active = code === lang;
                return (
                  <Pressable
                    key={code}
                    testID={`language-${code}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={LANGUAGE_LABELS[code]}
                    onPress={() => {
                      setLang(code);
                      setLangOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.languageRow,
                      active && styles.languageRowActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.languageLabel, active && styles.languageLabelActive]}>
                      {LANGUAGE_LABELS[code]}
                    </Text>
                    {active && <Ionicons name="checkmark" size={20} color={colors.onPrimary} />}
                  </Pressable>
                );
              })}
            </View>
          )}
        </Section>
        <Section title={t('sectionReasons')}>
          <ReasonsEditor />
        </Section>
        <Section title={t('sectionDangerZone')}>
          <PillButton
            testID="export-data"
            onPress={() => Alert.alert(t('exportDataTitle') as string, t('comingSoon') as string)}
            variant="light"
          >
            {t('exportData')}
          </PillButton>
          <PillButton testID="delete-account" onPress={openDelete} variant="danger">
            {t('deleteAccount')}
          </PillButton>
        </Section>
        <Section title={t('sectionAccount')}>
          <Text testID="account-user" style={styles.strong}>
            {user?.email || userName || t('connectedUser')}
          </Text>
          <PillButton testID="sign-out" onPress={disconnect} variant="sage">
            {t('signOut')}
          </PillButton>
        </Section>
        <View style={styles.about}>
          <View style={styles.infoRow}>
            <InfoIcon />
            <Text style={styles.strong}>{t('appName')}</Text>
          </View>
          <Text style={styles.aboutText}>{t('aboutTagline')}</Text>
          <Text style={styles.aboutText}>Fourkane Ahmer-Elain · v1.0.0</Text>
        </View>
      </ScrollView>
      <DialogModal visible={Boolean(summary)} onRequestClose={() => setSummary(null)}>
        <DialogTitle>{t('confirmEndTrimesterTitle')}</DialogTitle>
        <Text style={styles.muted}>
          {t('allClassesSummary', {
            merits: summary?.totalMerits ?? 0,
            detentions: summary?.totalDetentions ?? 0,
            students: summary?.totalStudents ?? 0,
          })}
        </Text>
        <Text style={styles.text}>{t('typeConfirmToContinue', { word: confirmWord })}</Text>
        <JournalInput
          testID="trimester-confirm-input"
          value={confirmText}
          onChangeText={setConfirmText}
          autoCapitalize="characters"
        />
        <PillButton onPress={confirm} variant="orange" disabled={confirmText !== confirmWord}>
          {t('iConfirm')}
        </PillButton>
        <PillButton onPress={() => setSummary(null)} variant="light">
          {t('cancel')}
        </PillButton>
      </DialogModal>
      <DialogModal visible={deleteOpen} onRequestClose={() => setDeleteOpen(false)}>
        <DialogTitle>{t('deleteAccountTitle')}</DialogTitle>
        <Text style={styles.muted}>{t('deleteAccountWarning')}</Text>
        <Text style={styles.text}>{t('typeConfirmToContinue', { word: deleteWord })}</Text>
        <JournalInput
          testID="delete-account-input"
          value={deleteText}
          onChangeText={setDeleteText}
          autoCapitalize="characters"
        />
        {deleteError && <Text style={styles.muted}>{deleteError}</Text>}
        <PillButton
          testID="delete-account-confirm"
          onPress={confirmDelete}
          variant="danger"
          disabled={deleteText !== deleteWord}
        >
          {t('deleteAccountConfirm')}
        </PillButton>
        <PillButton onPress={() => setDeleteOpen(false)} variant="light">
          {t('cancel')}
        </PillButton>
      </DialogModal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingTop: 16, paddingBottom: 96, paddingHorizontal: 16 },
  sectionBody: { marginTop: 12, gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  about: { marginTop: 24, alignItems: 'center', gap: 4 },
  aboutText: {
    color: colors.muted,
    fontFamily: typography.regular,
    fontSize: 17,
    textAlign: 'center',
  },
  strong: { color: colors.ink, fontFamily: typography.regular, fontSize: 23 },
  muted: {
    color: colors.muted,
    fontFamily: typography.regular,
    fontSize: 19,
    lineHeight: 24,
  },
  text: {
    color: colors.ink,
    fontFamily: typography.regular,
    fontSize: 19,
    lineHeight: 24,
    flex: 1,
  },
  success: {
    marginTop: 14,
    backgroundColor: colors.sage,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderWidth: 1.5,
  },
  languageMenu: { gap: 8 },
  languageRowActive: { backgroundColor: colors.pink },
  languageLabel: { color: colors.ink, fontFamily: typography.regular, fontSize: 21 },
  languageLabelActive: { color: colors.onPrimary },
  pressed: { transform: [{ scale: 0.97 }] },
});
