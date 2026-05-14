import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Alert, Animated, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { CROSSES_FOR_DETENTION, TICKS_FOR_MERIT } from '../constants/config';
import { useT } from '../utils/i18n';
import { USE_NATIVE_DRIVER } from '../utils/animation';
import { EmptyState } from '../components/EmptyState';
import { SwipeableHistoryItem } from '../components/SwipeableHistoryItem';
import { BackButton } from '../components/BackButton';
import { ProgressBar } from '../components/ProgressBar';
import { ReasonSheet } from '../components/ReasonSheet';
import { Card, Pill, PillButton, Screen, Sparkle, WashiTape } from '../components/Themed';
import { StudentAvatar } from '../components/StudentAvatar';
import { UndoSnackbar } from '../components/UndoSnackbar';
import { useHistory } from '../hooks/useHistory';
import { useStudent } from '../hooks/useStudents';
import { useHistoryMutations } from '../hooks/useHistoryMutations';
import type { ClassesStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<ClassesStackParamList, 'StudentDetail'>;

type PendingAction = 'tick' | 'cross' | null;

export const StudentDetailScreen = ({ route, navigation }: Props) => {
  const { t } = useT();
  const [action, setAction] = useState<PendingAction>(null);
  const [snack, setSnack] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const snackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { student } = useStudent(route.params.studentId);
  const { history, archives } = useHistory(student);
  const { tick, cross, forgot, undo, removeEvent } = useHistoryMutations();

  useEffect(
    () => () => {
      if (snackTimer.current) clearTimeout(snackTimer.current);
    },
    []
  );

  const reasons = useMemo(
    () => (action === 'tick' ? t('tickReasons') : t('crossReasons')) as string[],
    [action, t]
  );

  const runAction = async (reason: string) => {
    if (!student) return;
    const result =
      action === 'tick'
        ? await tick.mutateAsync({ student, reason })
        : await cross.mutateAsync({ student, reason });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(pulse, { toValue: 1.03, friction: 4, useNativeDriver: USE_NATIVE_DRIVER }).start(() =>
      pulse.setValue(1)
    );
    const compensated = action === 'tick' ? student.crosses > 0 : student.ticks > 0;
    const message =
      action === 'tick'
        ? compensated
          ? t('snackTickCancelledCross', { name: student.firstName })
          : t('snackTickAdded', { name: student.firstName })
        : compensated
          ? t('snackCrossCancelledTick', { name: student.firstName })
          : t('snackCrossAdded', { name: student.firstName });
    setAction(null);
    setSnackMessage(message as string);
    setSnack(true);
    if (snackTimer.current) clearTimeout(snackTimer.current);
    snackTimer.current = setTimeout(() => setSnack(false), 5000);
    if (snackTimer.current?.unref) snackTimer.current.unref();
    if ('meritObtained' in result && result.meritObtained) {
      const copy = t('meritCopy', { name: student.firstName }) as string;
      Alert.alert(t('meritObtainedTitle') as string, copy, [
        { text: t('copyMessage') as string, onPress: () => Clipboard.setStringAsync(copy) },
        { text: t('close') as string }
      ]);
    }
    if ('detentionTriggered' in result && result.detentionTriggered) {
      const copy = t('detentionCopy', { name: student.firstName }) as string;
      Alert.alert(t('detentionTriggeredTitle') as string, copy, [
        { text: t('copyMessage') as string, onPress: () => Clipboard.setStringAsync(copy) },
        { text: t('close') as string }
      ]);
    }
  };

  // Forgetting a notebook needs no reason, so it skips the reason sheet and is
  // recorded straight away.
  const runForgot = async () => {
    if (!student) return;
    await forgot.mutateAsync({ student });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(pulse, { toValue: 1.03, friction: 4, useNativeDriver: USE_NATIVE_DRIVER }).start(() =>
      pulse.setValue(1)
    );
    setSnackMessage(t('snackForgotAdded', { name: student.firstName }) as string);
    setSnack(true);
    if (snackTimer.current) clearTimeout(snackTimer.current);
    snackTimer.current = setTimeout(() => setSnack(false), 5000);
    if (snackTimer.current?.unref) snackTimer.current.unref();
  };

  if (!student) {
    return (
      <Screen>
        <Text style={styles.loading}>{t('loading')}</Text>
        <BackButton floating navigation={navigation} fallbackRoute="ClassesHome" />
      </Screen>
    );
  }

  const listHeader = (
    <>
      <WashiTape />
      <Card washi mascot style={styles.hero}>
        <View style={styles.heroRow}>
          <StudentAvatar student={student} size={62} />
          <View style={styles.heroText}>
            <Text accessibilityRole="header" style={styles.name}>
              {student.firstName} {student.lastName}
            </Text>
            <Text style={styles.meta}>{t('trimesterTracking', { trimester: student.currentTrimester })}</Text>
          </View>
        </View>
        <View style={styles.pills}>
          <Pill tone="sage">{t('ticksPill', { value: student.ticks, max: 4 })}</Pill>
          <Pill tone="pink">{t('crossesPill', { value: student.crosses, max: 4 })}</Pill>
          <Pill tone="orange">{t('meritsPlainPill', { count: student.merits })}</Pill>
          <Pill>{t('detentionsPlainPill', { count: student.detentions })}</Pill>
          <Pill tone="orange">{t('forgetsPill', { count: student.forgets })}</Pill>
        </View>
      </Card>
      <Animated.View style={[styles.actions, { transform: [{ scale: pulse }] }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tickAction') as string}
          onPress={() => setAction('tick')}
          style={({ pressed }) => [styles.bigAction, styles.tick, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>{t('tickAction')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('crossAction') as string}
          onPress={() => setAction('cross')}
          style={({ pressed }) => [styles.bigAction, styles.cross, pressed && styles.pressed]}
        >
          <Text style={[styles.actionText, styles.actionTextOnPink]}>{t('crossAction')}</Text>
        </Pressable>
      </Animated.View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('forgotAction') as string}
        onPress={runForgot}
        style={({ pressed }) => [styles.forgotAction, pressed && styles.pressed]}
      >
        <Ionicons name="book-outline" size={16} color={colors.ink} />
        <Text style={styles.forgotActionText}>{t('forgotAction')}</Text>
      </Pressable>
      <View style={styles.progressGroup}>
        <ProgressBar
          value={student.ticks}
          max={4}
          color={colors.successGreen}
          label={`${t('ticksLabel')} ${student.ticks}/4`}
        />
        <ProgressBar
          value={student.crosses}
          max={4}
          color={colors.dangerRed}
          label={`${t('crossesLabel')} ${student.crosses}/4`}
        />
        <Text style={styles.legend}>
          {t('counterLegend', { ticks: TICKS_FOR_MERIT, crosses: CROSSES_FOR_DETENTION })}
        </Text>
      </View>
      <Pill accessibilityRole="header" style={styles.sectionLabel}>
        {t('currentTermHistory')}
      </Pill>
    </>
  );

  return (
    <Screen>
      <FlatList
        testID="student-detail-list"
        data={history}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.historyContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            title={t('emptyHistoryTitle') as string}
            message={t('emptyHistoryMessage') as string}
          />
        }
        renderItem={({ item }) => (
          <SwipeableHistoryItem
            deleteLabel={t('delete') as string}
            onDelete={() => setEventToDelete(item.id)}
          >
            <Card style={styles.historyItem} mascot={false}>
              <View style={styles.historyRow}>
                <Sparkle />
                <Text style={styles.historyText}>
                  {item.type === 'tick'
                    ? t('typeTick')
                    : item.type === 'forgot'
                      ? t('typeForgot')
                      : t('typeCross')}
                  {item.reason ? ` - ${item.reason}` : ''}{' '}
                  {item.cancelled ? t('historyCancelled') : ''}
                </Text>
              </View>
            </Card>
          </SwipeableHistoryItem>
        )}
        ListFooterComponent={
          <Text style={styles.footer}>{t('termArchivesCount', { count: archives.length })}</Text>
        }
      />
      <ReasonSheet
        visible={Boolean(action)}
        reasons={reasons}
        onSelect={runAction}
        onClose={() => setAction(null)}
      />
      <UndoSnackbar
        visible={snack}
        message={snackMessage}
        onUndo={async () => {
          await undo.mutateAsync(student.id);
          setSnack(false);
        }}
      />
      <Modal
        visible={eventToDelete !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEventToDelete(null)}
      >
        <View style={styles.backdrop}>
          <Card style={styles.dialog} washi>
            <Text style={styles.modalTitle}>{t('deleteHistoryTitle')}</Text>
            <Text style={styles.modalText}>{t('deleteHistoryMessage')}</Text>
            <View style={styles.dialogActions}>
              <PillButton
                onPress={() => setEventToDelete(null)}
                variant="light"
                style={styles.dialogButton}
              >
                {t('cancel')}
              </PillButton>
              <PillButton
                onPress={() => {
                  if (eventToDelete !== null) removeEvent.mutate(eventToDelete);
                  setEventToDelete(null);
                }}
                variant="pink"
                style={styles.dialogButton}
              >
                {t('delete')}
              </PillButton>
            </View>
          </Card>
        </View>
      </Modal>
      <BackButton floating navigation={navigation} fallbackRoute="ClassesHome" />
    </Screen>
  );
};

const styles = StyleSheet.create({
  loading: { fontFamily: 'PatrickHand_400Regular', color: colors.ink, fontSize: 22, marginTop: 52, marginHorizontal: 16 },
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
  forgotAction: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 14,
    backgroundColor: colors.orangeSoft,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: 999
  },
  forgotActionText: {
    fontFamily: 'PatrickHand_400Regular',
    color: colors.ink,
    fontSize: 18
  },
  pressed: { transform: [{ scale: 0.97 }] },
  actionText: { fontFamily: 'PatrickHand_400Regular', color: colors.ink, fontSize: 26 },
  actionTextOnPink: { color: colors.onPrimary },
  progressGroup: { gap: 8, marginBottom: 14 },
  legend: { fontFamily: 'PatrickHand_400Regular', color: colors.muted, fontSize: 16, marginTop: 2 },
  sectionLabel: { marginBottom: 8 },
  historyItem: { padding: 12, marginBottom: 0 },
  historyContent: { flexGrow: 1, paddingTop: 76, paddingBottom: 96, paddingHorizontal: 16 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyText: { fontFamily: 'PatrickHand_400Regular', color: colors.ink, fontSize: 19, flex: 1 },
  footer: { fontFamily: 'PatrickHand_400Regular', color: colors.muted, fontSize: 19, marginTop: 12 },
  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'center', padding: 20 },
  dialog: { gap: 12 },
  modalTitle: { fontFamily: 'PatrickHand_400Regular', fontSize: 28, color: colors.ink },
  modalText: { fontFamily: 'PatrickHand_400Regular', fontSize: 19, color: colors.muted, lineHeight: 24 },
  dialogActions: { flexDirection: 'row', gap: 10 },
  dialogButton: { flex: 1 }
});
