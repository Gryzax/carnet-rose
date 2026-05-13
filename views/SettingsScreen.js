import { Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import { colors } from '../constants/colors';
import { reinitialiserTrimestre } from '../controllers/studentController';
import { getAllStudents } from '../models/studentModel';
import { PillButton, Screen, Title, useThemeColors } from '../components/Themed';

const Section = ({ title, children }) => {
  const theme = useThemeColors();
  return (
    <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 16, marginBottom: 14 }}>
      <Text style={{ color: theme.text, fontFamily: 'Nunito_800ExtraBold', fontSize: 20, marginBottom: 10 }}>{title}</Text>
      {children}
    </View>
  );
};

export const SettingsScreen = () => {
  const [summary, setSummary] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const theme = useThemeColors();

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

  return (
    <Screen>
      <Title>Paramètres</Title>
      <Section title="À propos">
        <Text style={{ color: theme.text, fontFamily: 'NunitoSans_700Bold' }}>Klassia</Text>
        <Text style={{ color: theme.muted, marginTop: 4 }}>Suivi hors ligne des élèves</Text>
        <Text style={{ color: theme.muted, marginTop: 4 }}>fourkane ahmerelain</Text>
        <Text style={{ color: theme.muted, marginTop: 4 }}>v1.0.0</Text>
      </Section>
      <Section title="Données">
        <TouchableOpacity testID="export-data" onPress={() => Alert.alert('Exporter les données', 'Fonctionnalité bientôt disponible')} style={{ borderColor: colors.deepPink, borderWidth: 1, borderRadius: 50, paddingVertical: 12, alignItems: 'center' }}>
          <Text style={{ color: colors.deepPink, fontFamily: 'NunitoSans_700Bold' }}>Exporter les données</Text>
        </TouchableOpacity>
      </Section>
      <Section title="Trimestre">
        <PillButton onPress={prepare}>Terminer le trimestre</PillButton>
        {success && <View style={{ marginTop: 14, backgroundColor: colors.lightPink, borderRadius: 20, padding: 14 }}><Text style={{ color: colors.textDark }}>Trimestre archivé : {success.totalEleves} élèves, {success.totalMerites} mérites, {success.totalRetenues} retenues.</Text></View>}
      </Section>
      <Modal transparent visible={Boolean(summary)} onRequestClose={() => setSummary(null)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.25)' }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 20, gap: 12 }}>
            <Text style={{ fontSize: 22, fontFamily: 'Nunito_800ExtraBold', color: theme.text }}>Confirmer la fin du trimestre</Text>
            <Text style={{ color: theme.muted }}>Toutes classes : {summary?.totalMerites} mérites, {summary?.totalRetenues} retenues, {summary?.totalEleves} élèves.</Text>
            <Text style={{ color: theme.text }}>Saisissez CONFIRMER pour continuer.</Text>
            <TextInput testID="trimester-confirm-input" value={confirmText} onChangeText={setConfirmText} autoCapitalize="characters" style={{ backgroundColor: theme.bg, color: theme.text, borderRadius: 14, padding: 12 }} />
            <PillButton onPress={confirm} style={{ opacity: confirmText === 'CONFIRMER' ? 1 : 0.5 }}>Je confirme</PillButton>
            <TouchableOpacity onPress={() => setSummary(null)}><Text style={{ textAlign: 'center', marginTop: 4, color: theme.muted }}>Annuler</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};
