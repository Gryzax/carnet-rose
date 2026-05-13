import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Alert, Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { colors } from '../constants/colors';
import { CROSS_REASONS, TICK_REASONS } from '../constants/config';
import { ajouterCroix, ajouterTick, annulerDerniereAction } from '../controllers/studentController';
import { getStudentById } from '../models/studentModel';
import { EmptyState } from '../components/EmptyState';
import { BackButton } from '../components/BackButton';
import { ProgressBar } from '../components/ProgressBar';
import { ReasonSheet } from '../components/ReasonSheet';
import { Card, Pill, Screen, Sparkle } from '../components/Themed';
import { StudentAvatar } from '../components/StudentAvatar';
import { UndoSnackbar } from '../components/UndoSnackbar';
import { useHistory } from '../hooks/useHistory';

export const StudentDetailScreen = ({ route, navigation }) => {
  const [student, setStudent] = useState(null);
  const [action, setAction] = useState(null);
  const [snack, setSnack] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const pulse = useRef(new Animated.Value(1)).current;
  const snackTimer = useRef(null);
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
    Animated.spring(pulse, { toValue: 1.03, friction: 4, useNativeDriver: true }).start(() => pulse.setValue(1));
    const compensated = action === 'tick' ? student.croix > 0 : student.ticks > 0;
    const message = action === 'tick'
      ? compensated ? `Tick utilisé pour annuler une croix de ${student.prenom}` : `Tick ajouté à ${student.prenom}`
      : compensated ? `Croix ajoutée et un tick retiré pour ${student.prenom}` : `Croix ajoutée à ${student.prenom}`;
    setStudent(result.eleve);
    setAction(null);
    setSnackMessage(message);
    setSnack(true);
    if (snackTimer.current) clearTimeout(snackTimer.current);
    snackTimer.current = setTimeout(() => setSnack(false), 5000);
    if (snackTimer.current?.unref) snackTimer.current.unref();
    if (result.meritObtenu) {
      const copy = `Félicitations à ${student.prenom} ! Élève sérieux, participatif et impliqué.`;
      Alert.alert('Mérite obtenu !', copy, [{ text: 'Copier le message', onPress: () => Clipboard.setStringAsync(copy) }, { text: 'Fermer' }]);
    }
    if (result.retenueDeclenchee) {
      const copy = `${student.prenom} a accumulé 4 croix. Travail non fait à plusieurs reprises malgré les rappels.`;
      Alert.alert('Retenue déclenchée', copy, [{ text: 'Copier le message', onPress: () => Clipboard.setStringAsync(copy) }, { text: 'Fermer' }]);
    }
    refresh();
  };

  if (!student) return <Screen><BackButton navigation={navigation} fallbackRoute="ClassesHome" /><Text style={styles.loading}>Chargement</Text></Screen>;

  return (
    <Screen>
      <BackButton navigation={navigation} fallbackRoute="ClassesHome" />
      <Card washi mascot style={styles.hero}>
        <View style={styles.heroRow}>
          <StudentAvatar student={student} size={62} />
          <View style={styles.heroText}>
            <Text style={styles.name}>{student.prenom} {student.nom}</Text>
            <Text style={styles.meta}>Suivi du trimestre {student.trimestreActuel}</Text>
          </View>
        </View>
        <View style={styles.pills}>
          <Pill tone="sage">Ticks {student.ticks}/4</Pill>
          <Pill tone="pink">Croix {student.croix}/4</Pill>
          <Pill tone="orange">Mérites {student.merites}</Pill>
          <Pill>Retenues {student.retenues}</Pill>
        </View>
      </Card>
      <Animated.View style={[styles.actions, { transform: [{ scale: pulse }] }]}>
        <Pressable onPress={() => setAction('tick')} style={({ pressed }) => [styles.bigAction, styles.tick, pressed && styles.pressed]}><Text style={styles.actionText}>TICK</Text></Pressable>
        <Pressable onPress={() => setAction('croix')} style={({ pressed }) => [styles.bigAction, styles.cross, pressed && styles.pressed]}><Text style={styles.actionText}>CROIX</Text></Pressable>
      </Animated.View>
      <View style={styles.progressGroup}>
        <ProgressBar value={student.ticks} max={4} color={colors.successGreen} />
        <ProgressBar value={student.croix} max={4} color={colors.dangerRed} />
      </View>
      <Text style={styles.sectionLabel}>HISTORIQUE DU TRIMESTRE COURANT</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.historyContent}
        ListEmptyComponent={<EmptyState icon="time-outline" title="Aucun historique" message="Les actions tick et croix apparaîtront ici." />}
        renderItem={({ item }) => (
          <Card style={styles.historyItem}>
            <View style={styles.historyRow}><Sparkle /><Text style={styles.historyText}>{item.type} - {item.raison} {item.annule ? '(annulé)' : ''}</Text></View>
          </Card>
        )}
        ListFooterComponent={<Text style={styles.footer}>Archives trimestrielles : {archives.length}</Text>}
      />
      <ReasonSheet visible={Boolean(action)} reasons={reasons} onSelect={runAction} onClose={() => setAction(null)} />
      <UndoSnackbar visible={snack} message={snackMessage} onUndo={async () => { await annulerDerniereAction(student.id); await load(); await refresh(); setSnack(false); }} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  loading: { fontFamily: 'PatrickHand_400Regular', color: colors.ink, fontSize: 22 },
  hero: { marginBottom: 16 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroText: { flex: 1 },
  name: { fontFamily: 'PatrickHand_400Regular', fontSize: 31, color: colors.ink, lineHeight: 36 },
  meta: { fontFamily: 'PatrickHand_400Regular', color: colors.muted, fontSize: 19 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  bigAction: { flex: 1, borderColor: colors.border, borderWidth: 1.5, borderRadius: 8, padding: 18, alignItems: 'center' },
  tick: { backgroundColor: colors.sage },
  cross: { backgroundColor: colors.pink },
  pressed: { transform: [{ scale: 0.97 }] },
  actionText: { fontFamily: 'PatrickHand_400Regular', color: colors.ink, fontSize: 26 },
  progressGroup: { gap: 8, marginBottom: 14 },
  sectionLabel: { alignSelf: 'flex-start', backgroundColor: colors.sage, borderColor: colors.border, borderWidth: 1.5, borderRadius: 999, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 5, color: colors.ink, fontFamily: 'PatrickHand_400Regular', fontSize: 16, marginBottom: 8 },
  historyItem: { padding: 12, marginBottom: 8 },
  historyContent: { paddingBottom: 96 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyText: { fontFamily: 'PatrickHand_400Regular', color: colors.ink, fontSize: 19, flex: 1 },
  footer: { fontFamily: 'PatrickHand_400Regular', color: colors.muted, fontSize: 19, marginTop: 12 }
});
