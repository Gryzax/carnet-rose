import { Alert, Modal, Text, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import { colors } from '../constants/colors';
import { reinitialiserTrimestre } from '../controllers/studentController';
import { getAllStudents } from '../models/studentModel';
import { PillButton, Screen, Title } from '../components/Themed';

export const SettingsScreen = () => {
  const [summary, setSummary] = useState(null);
  const [success, setSuccess] = useState(null);
  const prepare = async () => {
    const students = await getAllStudents();
    setSummary({ totalMerites: students.reduce((s, e) => s + e.merites, 0), totalRetenues: students.reduce((s, e) => s + e.retenues, 0), totalEleves: students.length, trimestre: students[0]?.trimestreActuel || 1 });
  };
  const confirm = () => Alert.alert('Deuxième confirmation', 'Confirmer définitivement la fin du trimestre ?', [{ text: 'Annuler' }, { text: 'Confirmer', style: 'destructive', onPress: async () => { const res = await reinitialiserTrimestre(summary.trimestre); setSummary(null); setSuccess(res); } }]);
  return (
    <Screen>
      <Title>Paramètres</Title>
      <Text style={{ color: colors.textMuted, marginBottom: 20 }}>Carnet Rose · suivi hors ligne des classes</Text>
      <PillButton onPress={prepare}>Terminer le trimestre</PillButton>
      {success && <View style={{ marginTop: 18, backgroundColor: colors.lightPink, borderRadius: 20, padding: 16 }}><Text>Trimestre archivé : {success.totalEleves} élèves, {success.totalMerites} mérites, {success.totalRetenues} retenues.</Text></View>}
      <Modal transparent visible={Boolean(summary)}><View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.25)' }}><View style={{ backgroundColor: colors.white, borderRadius: 20, padding: 20 }}><Text style={{ fontSize: 20, fontWeight: '700' }}>Confirmer la fin du trimestre</Text><Text style={{ marginVertical: 14 }}>Toutes classes : {summary?.totalMerites} mérites, {summary?.totalRetenues} retenues, {summary?.totalEleves} élèves.</Text><PillButton onPress={confirm}>Je confirme</PillButton><TouchableOpacity onPress={() => setSummary(null)}><Text style={{ textAlign: 'center', marginTop: 14, color: colors.textMuted }}>Annuler</Text></TouchableOpacity></View></View></Modal>
    </Screen>
  );
};
