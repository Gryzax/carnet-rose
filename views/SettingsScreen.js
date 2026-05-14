import { Alert, Modal, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { colors } from '../constants/colors';
import { reinitialiserTrimestre } from '../controllers/studentController';
import { getAllStudents } from '../models/studentModel';
import { BackButton } from '../components/BackButton';
import { Card, InfoIcon, JournalInput, Pill, PillButton, Screen, Sparkle, Title } from '../components/Themed';
import { getCurrentUser, signOut } from '../services/auth/authService';
import { syncAll } from '../services/sync/syncService';

const Section = ({ title, children }) => (
  <Card washi>
    <Pill>{title}</Pill>
    <View style={styles.sectionBody}>{children}</View>
  </Card>
);

export const SettingsScreen = ({ navigation, onSignedOut }) => {
  const [summary, setSummary] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [user, setUser] = useState(null);

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
    setSummary({ totalMerites: students.reduce((s, e) => s + e.merites, 0), totalRetenues: students.reduce((s, e) => s + e.retenues, 0), totalEleves: students.length, trimestre: students[0]?.trimestreActuel || 1 });
  };

  const confirm = async () => {
    if (confirmText !== 'CONFIRMER') return;
    const res = await reinitialiserTrimestre(summary.trimestre);
    setSummary(null);
    setSuccess(res);
  };

  const disconnect = async () => {
    await signOut();
    setUser(null);
    onSignedOut?.();
  };

  const synchronizeNow = async () => {
    const result = await syncAll();
    if (result.synced) {
      Alert.alert('Synchroniser maintenant', 'Synchronisation terminée');
    } else {
      Alert.alert('Synchroniser maintenant', 'Synchronisation impossible pour le moment. Vos données restent sauvegardées localement.');
    }
  };

  return (
    <Screen>
      <BackButton navigation={navigation} fallbackRoute="Classes" />
      <Title>Parametres</Title>
      <Section title="Compte">
        <Text testID="account-user" style={styles.strong}>{user?.email || user?.user_metadata?.name || 'Utilisateur connecte'}</Text>
        <PillButton testID="sync-now" onPress={synchronizeNow} variant="light">Synchroniser maintenant</PillButton>
        <PillButton testID="sign-out" onPress={disconnect} variant="pink">Se deconnecter</PillButton>
      </Section>
      <Section title="A propos">
        <View style={styles.infoRow}><InfoIcon /><Text style={styles.strong}>Carnet Rose</Text></View>
        <Text style={styles.muted}>Suivi hors ligne des eleves</Text>
        <Text style={styles.muted}>fourkane ahmerelain</Text>
        <Text style={styles.muted}>v1.0.0</Text>
      </Section>
      <Section title="Donnees">
        <PillButton testID="export-data" onPress={() => Alert.alert('Exporter les donnees', 'Fonctionnalite bientot disponible')} variant="light">Exporter les donnees</PillButton>
      </Section>
      <Section title="Trimestre">
        <PillButton onPress={prepare} variant="pink">Terminer le trimestre</PillButton>
        {success && <View style={styles.success}><Sparkle /><Text style={styles.text}>Trimestre archive : {success.totalEleves} eleves, {success.totalMerites} merites, {success.totalRetenues} retenues.</Text></View>}
      </Section>
      <Modal transparent visible={Boolean(summary)} onRequestClose={() => setSummary(null)}>
        <View style={styles.backdrop}>
          <Card style={styles.dialog} washi>
            <Text style={styles.modalTitle}>Confirmer la fin du trimestre</Text>
            <Text style={styles.muted}>Toutes classes : {summary?.totalMerites} merites, {summary?.totalRetenues} retenues, {summary?.totalEleves} eleves.</Text>
            <Text style={styles.text}>Saisissez CONFIRMER pour continuer.</Text>
            <JournalInput testID="trimester-confirm-input" value={confirmText} onChangeText={setConfirmText} autoCapitalize="characters" />
            <PillButton onPress={confirm} variant="pink" disabled={confirmText !== 'CONFIRMER'}>Je confirme</PillButton>
            <PillButton onPress={() => setSummary(null)} variant="light">Annuler</PillButton>
          </Card>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  sectionBody: { marginTop: 12, gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  strong: { color: colors.ink, fontFamily: 'PatrickHand_400Regular', fontSize: 23 },
  muted: { color: colors.muted, fontFamily: 'PatrickHand_400Regular', fontSize: 19, lineHeight: 24 },
  text: { color: colors.ink, fontFamily: 'PatrickHand_400Regular', fontSize: 19, lineHeight: 24, flex: 1 },
  success: { marginTop: 14, backgroundColor: colors.sage, borderColor: colors.border, borderWidth: 1.5, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  backdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.scrim },
  dialog: { gap: 12 },
  modalTitle: { fontSize: 28, fontFamily: 'PatrickHand_400Regular', color: colors.ink }
});
