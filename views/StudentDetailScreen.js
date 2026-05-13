import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Alert, Animated, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { colors } from '../constants/colors';
import { CROSS_REASONS, TICK_REASONS } from '../constants/config';
import { ajouterCroix, ajouterTick, annulerDerniereAction } from '../controllers/studentController';
import { getStudentById } from '../models/studentModel';
import { EmptyState } from '../components/EmptyState';
import { ProgressBar } from '../components/ProgressBar';
import { ReasonSheet } from '../components/ReasonSheet';
import { Screen, useThemeColors } from '../components/Themed';
import { StudentAvatar } from '../components/StudentAvatar';
import { UndoSnackbar } from '../components/UndoSnackbar';
import { useHistory } from '../hooks/useHistory';

export const StudentDetailScreen = ({ route }) => {
  const [student, setStudent] = useState(null);
  const [action, setAction] = useState(null);
  const [snack, setSnack] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const pulse = useRef(new Animated.Value(1)).current;
  const snackTimer = useRef(null);
  const theme = useThemeColors();
  const { history, archives, refresh } = useHistory(student);
  const load = useCallback(async () => setStudent(await getStudentById(route.params.studentId)), [route.params.studentId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => () => {
    if (snackTimer.current) clearTimeout(snackTimer.current);
  }, []);

  const reasons = useMemo(() => action === 'tick' ? TICK_REASONS : CROSS_REASONS, [action]);

  const runAction = async (reason) => {
    const result = action === 'tick' ? await ajouterTick(student, reason) : await ajouterCroix(student, reason);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(pulse, { toValue: 1.04, friction: 3, useNativeDriver: true }).start(() => pulse.setValue(1));
    const compensated = action === 'tick' ? student.croix > 0 : student.ticks > 0;
    const message = action === 'tick'
      ? compensated ? `Tick utilise pour annuler une croix de ${student.prenom}` : `Tick ajoute a ${student.prenom}`
      : compensated ? `Croix ajoutee et un tick retire pour ${student.prenom}` : `Croix ajoutee a ${student.prenom}`;
    setStudent(result.eleve);
    setAction(null);
    setSnackMessage(message);
    setSnack(true);
    if (snackTimer.current) clearTimeout(snackTimer.current);
    snackTimer.current = setTimeout(() => setSnack(false), 5000);
    if (snackTimer.current?.unref) snackTimer.current.unref();
    if (result.meritObtenu) {
      const copy = `Felicitations a ${student.prenom} ! Eleve serieux, participatif et implique.`;
      Alert.alert('Merite obtenu !', copy, [{ text: 'Copier le message', onPress: () => Clipboard.setStringAsync(copy) }, { text: 'Fermer' }]);
    }
    if (result.retenueDeclenchee) {
      const copy = `${student.prenom} a accumule 4 croix. Travail non fait a plusieurs reprises malgre les rappels.`;
      Alert.alert('Retenue declenchee', copy, [{ text: 'Copier le message', onPress: () => Clipboard.setStringAsync(copy) }, { text: 'Fermer' }]);
    }
    refresh();
  };

  if (!student) return <Screen><Text style={{ color: theme.text }}>Chargement</Text></Screen>;

  return (
    <Screen>
      <LinearGradient colors={theme.dark ? ['#5A1F3A', colors.darkBg] : [colors.lightPink, colors.white]} style={{ borderRadius: 20, padding: 18, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <StudentAvatar student={student} size={60} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 26, color: theme.text }}>{student.prenom} {student.nom}</Text>
            <Text style={{ color: theme.muted, fontFamily: 'NunitoSans_600SemiBold' }}>Suivi du trimestre {student.trimestreActuel}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          {[[`Ticks ${student.ticks}/4`, colors.successGreen], [`Croix ${student.croix}/4`, colors.dangerRed], [`Merites ${student.merites}`, colors.primaryPink], [`Retenues ${student.retenues}`, colors.warningOrange]].map(([label, color]) => (
            <Text key={label} style={{ backgroundColor: color, color: colors.textDark, borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6, overflow: 'hidden', fontFamily: 'NunitoSans_700Bold' }}>{label}</Text>
          ))}
        </View>
      </LinearGradient>
      <Animated.View style={{ transform: [{ scale: pulse }], flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setAction('tick')} style={{ flex: 1, backgroundColor: colors.successGreen, borderRadius: 20, padding: 20, alignItems: 'center' }}><Text style={{ fontSize: 20, fontFamily: 'Nunito_800ExtraBold', color: colors.textDark }}>TICK</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setAction('croix')} style={{ flex: 1, backgroundColor: colors.dangerRed, borderRadius: 20, padding: 20, alignItems: 'center' }}><Text style={{ fontSize: 20, fontFamily: 'Nunito_800ExtraBold', color: colors.textDark }}>CROIX</Text></TouchableOpacity>
      </Animated.View>
      <View style={{ gap: 8, marginBottom: 14 }}>
        <ProgressBar value={student.ticks} max={4} color={colors.successGreen} />
        <ProgressBar value={student.croix} max={4} color={colors.dangerRed} />
      </View>
      <Text style={{ color: theme.muted, marginBottom: 8, fontFamily: 'NunitoSans_700Bold' }}>Historique du trimestre courant</Text>
      <FlatList data={history} keyExtractor={(item) => String(item.id)} ListEmptyComponent={<EmptyState icon="time-outline" title="Aucun historique" message="Les actions tick et croix apparaitront ici." />} renderItem={({ item }) => <Text style={{ padding: 10, color: theme.text, backgroundColor: theme.card, borderRadius: 12, marginBottom: 8 }}>{item.type} - {item.raison} {item.annule ? '(annule)' : ''}</Text>} ListFooterComponent={<Text style={{ color: colors.deepPink, marginTop: 12 }}>Archives trimestrielles : {archives.length}</Text>} />
      <ReasonSheet visible={Boolean(action)} reasons={reasons} onSelect={runAction} onClose={() => setAction(null)} />
      <UndoSnackbar visible={snack} message={snackMessage} onUndo={async () => { await annulerDerniereAction(student.id); await load(); await refresh(); setSnack(false); }} />
    </Screen>
  );
};
