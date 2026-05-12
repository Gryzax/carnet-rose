import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Alert, Animated, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { colors } from '../constants/colors';
import { CROSS_REASONS, TICK_REASONS } from '../constants/config';
import { ajouterCroix, ajouterTick, annulerDerniereAction } from '../controllers/studentController';
import { getStudentById } from '../models/studentModel';
import { ReasonSheet } from '../components/ReasonSheet';
import { Screen, Title } from '../components/Themed';
import { UndoSnackbar } from '../components/UndoSnackbar';
import { useHistory } from '../hooks/useHistory';

export const StudentDetailScreen = ({ route }) => {
  const [student, setStudent] = useState(null);
  const [action, setAction] = useState(null);
  const [snack, setSnack] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;
  const { history, archives, refresh } = useHistory(student);
  const load = useCallback(async () => setStudent(await getStudentById(route.params.studentId)), [route.params.studentId]);
  useEffect(() => { load(); }, [load]);
  const reasons = useMemo(() => action === 'tick' ? TICK_REASONS : CROSS_REASONS, [action]);
  const runAction = async (reason) => {
    const result = action === 'tick' ? await ajouterTick(student, reason) : await ajouterCroix(student, reason);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(pulse, { toValue: 1.06, friction: 3, useNativeDriver: true }).start(() => pulse.setValue(1));
    setStudent(result.eleve);
    setAction(null);
    setSnack(true);
    setTimeout(() => setSnack(false), 5000);
    if (result.meritObtenu) {
      const message = `Félicitations à ${student.prenom} ! Élève sérieux, participatif et impliqué.`;
      Alert.alert('Mérite obtenu !', message, [{ text: 'Copier le message', onPress: () => Clipboard.setStringAsync(message) }, { text: 'OK' }]);
    }
    if (result.retenueDeclenchee) {
      const message = `${student.prenom} a accumulé 4 croix. Travail non fait à plusieurs reprises malgré les rappels.`;
      Alert.alert('⚠️ Retenue déclenchée', message, [{ text: 'Copier le message', onPress: () => Clipboard.setStringAsync(message) }, { text: 'OK' }]);
    }
    refresh();
  };
  if (!student) return <Screen><Text>Chargement</Text></Screen>;
  return (
    <Screen>
      <Title>{student.prenom} {student.nom}</Title>
      <Animated.View style={{ transform: [{ scale: pulse }], flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setAction('tick')} style={{ flex: 1, backgroundColor: colors.successGreen, borderRadius: 20, padding: 24, alignItems: 'center' }}><Text style={{ fontSize: 20 }}>✅ TICK</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setAction('croix')} style={{ flex: 1, backgroundColor: colors.dangerRed, borderRadius: 20, padding: 24, alignItems: 'center' }}><Text style={{ fontSize: 20 }}>❌ CROIX</Text></TouchableOpacity>
      </Animated.View>
      <Text style={{ color: colors.textMuted, marginBottom: 8 }}>Historique du trimestre courant</Text>
      <FlatList data={history} keyExtractor={(item) => String(item.id)} renderItem={({ item }) => <Text style={{ padding: 10, color: colors.textDark }}>{item.type} · {item.raison} {item.annule ? '(annulé)' : ''}</Text>} ListFooterComponent={<Text style={{ color: colors.deepPink, marginTop: 12 }}>Archives trimestrielles : {archives.length}</Text>} />
      <ReasonSheet visible={Boolean(action)} reasons={reasons} onSelect={runAction} onClose={() => setAction(null)} />
      <UndoSnackbar visible={snack} onUndo={async () => { await annulerDerniereAction(student.id); await load(); await refresh(); setSnack(false); }} />
    </Screen>
  );
};
