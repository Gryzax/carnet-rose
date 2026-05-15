import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Alert, Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../constants/colors';
import { useThresholds } from '../utils/thresholds';
import { useT } from '../utils/i18n';
import { USE_NATIVE_DRIVER } from '../utils/animation';
import { EmptyState } from '../components/EmptyState';
import { SheetModal } from '../components/SheetModal';
import { BackButton } from '../components/BackButton';
import { ProgressBar } from '../components/ProgressBar';
import { ReasonSheet } from '../components/ReasonSheet';
import { Card, Pill, Screen, Sparkle, WashiTape } from '../components/Themed';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StudentAvatar } from '../components/StudentAvatar';
import { UndoSnackbar } from '../components/UndoSnackbar';
import { useHistory } from '../hooks/useHistory';
import { useStudent } from '../hooks/useStudents';
import { useHistoryMutations } from '../hooks/useHistoryMutations';
import { useReasons } from '../utils/reasons';
import type { ClassesStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<ClassesStackParamList, 'StudentDetail'>;

type PendingAction = 'tick' | 'cross' | null;

export const StudentDetailScreen = ({ route, navigation }: Props) => {
  const { t, lang } = useT();
  const { ticksForMerit, crossesForDetention } = useThresholds();
  const [action, setAction] = useState<PendingAction>(null);
  const [snack, setSnack] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  // The history entry whose "..." options menu is currently open.
  const [menuForEvent, setMenuForEvent] = useState<string | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const snackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { student } = useStudent(route.params.studentId);
  const { history, archives } = useHistory(student);
  const { tick, cross, forgot, undo, removeEvent } = useHistoryMutations();
  const { tickReasons, crossReasons } = useReasons();

  useEffect(
    () => () => {
      if (snackTimer.current) clearTimeout(snackTimer.current);
    },
    [],
  );

  const formatEventDate = useMemo(() => {
    try {
      const formatter = new Intl.DateTimeFormat(lang, {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      return (iso: string) => formatter.format(new Date(iso));
    } catch {
      return (iso: string) => new Date(iso).toLocaleString();
    }
  }, [lang]);

  const reasons = useMemo(
    () => (action === 'tick' ? tickReasons : crossReasons),
    [action, tickReasons, crossReasons],
  );

  const runAction = async (reason: string) => {
    if (!student) return;
    const result =
      action === 'tick'
        ? await tick.mutateAsync({ student, reason })
        : await cross.mutateAsync({ student, reason });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(pulse, {
      toValue: 1.03,
      friction: 4,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start(() => pulse.setValue(1));
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
        { text: t('close') as string },
      ]);
    }
    if ('detentionTriggered' in result && result.detentionTriggered) {
      const copy = t('detentionCopy', { name: student.firstName }) as string;
      Alert.alert(t('detentionTriggeredTitle') as string, copy, [
        { text: t('copyMessage') as string, onPress: () => Clipboard.setStringAsync(copy) },
        { text: t('close') as string },
      ]);
    }
  };

  // Forgetting a notebook needs no reason, so it skips the reason sheet and is
  // recorded straight away.
  const runForgot = async () => {
    if (!student) return;
    await forgot.mutateAsync({ student });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(pulse, {
      toValue: 1.03,
      friction: 4,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start(() => pulse.setValue(1));
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
            <Text style={styles.meta}>
              {t('trimesterTracking', { trimester: student.currentTrimester })}
            </Text>
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
          max={ticksForMerit}
          color={colors.successGreen}
          label={`${t('ticksLabel')} ${student.ticks}/${ticksForMerit}`}
        />
        <ProgressBar
          value={student.crosses}
          max={crossesForDetention}
          color={colors.dangerRed}
          label={`${t('crossesLabel')} ${student.crosses}/${crossesForDetention}`}
        />
        <Text style={styles.legend}>
          {t('counterLegend', { ticks: ticksForMerit, crosses: crossesForDetention })}
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
        renderItem={({ item }) => {
          const meritEarned =
            item.type === 'tick' && !item.cancelled && item.newTicks < item.previousTicks;
          const detentionEarned =
            item.type === 'cross' && !item.cancelled && item.newCrosses < item.previousCrosses;
          const baseLabel =
            item.type === 'tick'
              ? t('typeTick')
              : item.type === 'forgot'
                ? t('typeForgot')
                : t('typeCross');
          const milestoneLabel = meritEarned
            ? (t('historyMeritEarned') as string)
            : detentionEarned
              ? (t('historyDetentionEarned') as string)
              : null;
          return (
            <Card style={styles.historyItem} mascot={false}>
              <View style={styles.historyRow}>
                <Sparkle />
                <View style={styles.historyTextWrap}>
                  <Text style={styles.historyText}>
                    {baseLabel}
                    {item.reason ? ` - ${item.reason}` : ''}{' '}
                    {item.cancelled ? t('historyCancelled') : ''}
                  </Text>
                  {milestoneLabel && <Text style={styles.historyMilestone}>{milestoneLabel}</Text>}
                  <Text style={styles.historyDate}>{formatEventDate(item.createdAt)}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('eventOptions') as string}
                  hitSlop={8}
                  onPress={() => setMenuForEvent(item.id)}
                  style={({ pressed }) => [styles.optionsButton, pressed && styles.pressed]}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color={colors.muted} />
                </Pressable>
              </View>
            </Card>
          );
        }}
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
      <SheetModal
        visible={menuForEvent !== null}
        onRequestClose={() => setMenuForEvent(null)}
        onBackdropPress={() => setMenuForEvent(null)}
        backdropLabel={t('cancel') as string}
      >
        <View style={styles.menu}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('delete') as string}
            onPress={() => {
              setEventToDelete(menuForEvent);
              setMenuForEvent(null);
            }}
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
          >
            <Ionicons name="trash-outline" size={20} color={colors.dangerRed} />
            <Text style={styles.menuItemText}>{t('delete')}</Text>
          </Pressable>
        </View>
      </SheetModal>
      <ConfirmDialog
        visible={eventToDelete !== null}
        title={t('deleteHistoryTitle') as string}
        message={t('deleteHistoryMessage') as string}
        cancelLabel={t('cancel') as string}
        confirmLabel={t('delete') as string}
        onCancel={() => setEventToDelete(null)}
        onConfirm={() => {
          if (eventToDelete !== null) removeEvent.mutate(eventToDelete);
          setEventToDelete(null);
        }}
      />
      <BackButton floating navigation={navigation} fallbackRoute="ClassesHome" />
    </Screen>
  );
};

const styles = StyleSheet.create({
  loading: {
    fontFamily: typography.regular,
    color: colors.ink,
    fontSize: 22,
    marginTop: 52,
    marginHorizontal: 16,
  },
  hero: { marginBottom: 16 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroText: { flex: 1 },
  name: { fontFamily: typography.regular, fontSize: 31, color: colors.ink, lineHeight: 36 },
  meta: { fontFamily: typography.regular, color: colors.muted, fontSize: 19 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  bigAction: {
    flex: 1,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
  },
  tick: { backgroundColor: colors.sage },
  cross: { backgroundColor: colors.pink },
  forgotAction: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 14,
    backgroundColor: colors.orangeSoft,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: 999,
  },
  forgotActionText: {
    fontFamily: typography.regular,
    color: colors.ink,
    fontSize: 18,
  },
  pressed: { transform: [{ scale: 0.97 }] },
  actionText: { fontFamily: typography.regular, color: colors.ink, fontSize: 26 },
  actionTextOnPink: { color: colors.onPrimary },
  progressGroup: { gap: 8, marginBottom: 14 },
  legend: { fontFamily: typography.regular, color: colors.muted, fontSize: 16, marginTop: 2 },
  sectionLabel: { marginBottom: 8 },
  historyItem: { padding: 12, marginBottom: 8 },
  historyContent: { flexGrow: 1, paddingTop: 76, paddingBottom: 96, paddingHorizontal: 16 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyTextWrap: { flex: 1 },
  historyText: { fontFamily: typography.regular, color: colors.ink, fontSize: 19 },
  historyDate: { fontFamily: typography.regular, color: colors.muted, fontSize: 14, marginTop: 2 },
  historyMilestone: {
    fontFamily: typography.regular,
    color: colors.deepPink,
    fontSize: 16,
    marginTop: 2,
  },
  optionsButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  menu: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderColor: colors.border,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  menuItem: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuItemText: { fontFamily: typography.regular, fontSize: 20, color: colors.ink },
  footer: {
    fontFamily: typography.regular,
    color: colors.muted,
    fontSize: 19,
    marginTop: 12,
  },
});
