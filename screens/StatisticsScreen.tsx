import { useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type DimensionValue
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { colors } from '../constants/colors';
import type { StatsPeriod } from '../domain/statisticsController';
import { EmptyState } from '../components/EmptyState';
import { StudentAvatar } from '../components/StudentAvatar';
import { SheetModal } from '../components/SheetModal';
import { Card, Pill, PillButton, Screen, Sparkle, Title, WashiTape, type IoniconName } from '../components/Themed';
import { useT } from '../utils/i18n';
import { useStatistics } from '../hooks/useStatistics';
import type { AppTabsParamList } from '../navigation/types';

type Props = BottomTabScreenProps<AppTabsParamList, 'Statistics'>;

type QuickList = 'toWatch' | 'forgottenNotebooks' | 'noRecentEvent';
type TopTab = 'encourage' | 'reframe';

// A student row as produced by the statistics controller — counters plus
// optional localisation metadata.
interface StatStudent {
  id: string;
  firstName?: string;
  lastName?: string;
  ticks?: number;
  crosses?: number;
  metaKey?: string;
  metaParams?: Record<string, string | number>;
  meta?: string;
}

const PERIOD_VALUES: StatsPeriod[] = ['week', 'month', 'trimester'];
const PERIOD_NOUN_KEY: Record<StatsPeriod, string> = {
  week: 'periodNounWeek',
  month: 'periodNounMonth',
  trimester: 'periodNounTrimester'
};
const PERIOD_LABEL_KEY: Record<StatsPeriod, string> = {
  week: 'periodWeek',
  month: 'periodMonth',
  trimester: 'periodTrimester'
};

const CLIMATE_TONE: Record<string, string> = {
  success: colors.successGreen,
  warning: colors.warningOrange,
  danger: colors.dangerRed,
  neutral: colors.sage
};

// --- Small building blocks -------------------------------------------------

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <Pill accessibilityRole="header" style={styles.sectionLabel}>
    {children}
  </Pill>
);

interface SegmentedProps {
  options: { value: StatsPeriod; label: string }[];
  value: StatsPeriod;
  onChange: (value: StatsPeriod) => void;
}

const Segmented = ({ options, value, onChange }: SegmentedProps) => (
  <View style={styles.segmented}>
    {options.map((option) => {
      const active = option.value === value;
      return (
        <Pressable
          key={String(option.value)}
          testID={`period-${option.value}`}
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
          accessibilityLabel={option.label}
          onPress={() => onChange(option.value)}
          style={({ pressed }) => [styles.segment, active && styles.segmentActive, pressed && styles.pressed]}
        >
          <Text style={[styles.segmentText, active && styles.textOnPink]}>{option.label}</Text>
        </Pressable>
      );
    })}
  </View>
);

interface StatTileProps {
  icon: IoniconName;
  value: ReactNode;
  label: string;
  tone?: string;
}

const StatTile = ({ icon, value, label, tone }: StatTileProps) => (
  <View style={[styles.tile, tone && { backgroundColor: tone }]}>
    <View style={styles.tileHead}>
      <Ionicons name={icon} size={16} color={colors.ink} />
      <Text style={styles.tileValue}>{value}</Text>
    </View>
    <Text style={styles.tileLabel}>{label}</Text>
  </View>
);

const StudentRow = ({ student, onPress }: { student: StatStudent; onPress: () => void }) => {
  const { t } = useT();
  const meta = student.metaKey ? t(student.metaKey, student.metaParams) : student.meta;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${student.firstName} ${student.lastName}`}
      onPress={onPress}
      style={({ pressed }) => [styles.studentRow, pressed && styles.pressed]}
    >
      <StudentAvatar student={student} size={36} />
      <View style={styles.studentText}>
        <Text style={styles.studentName} numberOfLines={1}>
          {String(student.lastName || '').toUpperCase()} {student.firstName}
        </Text>
        {!!meta && <Text style={styles.studentMeta}>{meta}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
};

interface StudentListProps {
  students: StatStudent[];
  emptyLabel: ReactNode;
  onSelect: (student: StatStudent) => void;
}

const StudentList = ({ students, emptyLabel, onSelect }: StudentListProps) => {
  if (!students.length) {
    return (
      <View style={styles.inlineEmpty}>
        <Sparkle />
        <Text style={styles.inlineEmptyText}>{emptyLabel}</Text>
      </View>
    );
  }
  return (
    <View style={styles.studentList}>
      {students.map((student) => (
        <StudentRow key={student.id} student={student} onPress={() => onSelect(student)} />
      ))}
    </View>
  );
};

interface EvolutionBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

const EvolutionBar = ({ label, value, max, color }: EvolutionBarProps) => {
  const ratio = max > 0 ? value / max : 0;
  const width: DimensionValue = value > 0 ? `${Math.max(6, Math.round(ratio * 100))}%` : '0%';
  return (
    <View style={styles.evoRow}>
      <Text style={styles.evoLabel}>{label}</Text>
      <View style={styles.evoTrack}>
        <View style={[styles.evoFill, { width, backgroundColor: color }]} />
      </View>
      <Text style={styles.evoValue}>{value}</Text>
    </View>
  );
};

// --- Screen ----------------------------------------------------------------

export const StatisticsScreen = ({ navigation }: Props) => {
  const { t } = useT();
  const [period, setPeriod] = useState<StatsPeriod>('week');
  const [classId, setClassId] = useState<string | null>(null);
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [topTab, setTopTab] = useState<TopTab>('encourage');
  const [quickList, setQuickList] = useState<QuickList>('toWatch');
  const [archiveTrimester, setArchiveTrimester] = useState<number | null>(null);

  const { stats, loading } = useStatistics(period, classId);

  const periodOptions = useMemo(
    () => PERIOD_VALUES.map((value) => ({ value, label: t(PERIOD_LABEL_KEY[value]) as string })),
    [t]
  );
  const allClassesLabel = t('allClasses') as string;
  const classOptions = useMemo<{ id: string | null; name: string }[]>(
    () => [{ id: null, name: allClassesLabel }, ...(stats?.classes || [])],
    [stats, allClassesLabel]
  );
  const selectedClassName = useMemo(
    () => classOptions.find((c) => c.id === classId)?.name || allClassesLabel,
    [classOptions, classId, allClassesLabel]
  );

  const openStudent = (student: StatStudent) => {
    navigation.navigate('Classes', { screen: 'StudentDetail', params: { studentId: student.id } });
  };

  const quickStudents: StatStudent[] = stats ? stats.quickActions[quickList] : [];
  const quickEmptyLabel = {
    toWatch: t('emptyToWatch'),
    forgottenNotebooks: t('emptyForgotten'),
    noRecentEvent: t('emptyNoEvent')
  }[quickList];

  const topStudents: StatStudent[] = stats ? stats.top[topTab] : [];
  const topEmptyLabel = topTab === 'encourage' ? t('emptyEncourage') : t('emptyReframe');

  const evolution = stats?.evolution || { ticks: 0, crosses: 0, merits: 0, detentions: 0 };
  const evolutionMax = Math.max(
    1,
    evolution.ticks,
    evolution.crosses,
    evolution.merits,
    evolution.detentions
  );

  const selectedArchive = stats?.archives.find((a) => a.trimester === archiveTrimester) || null;

  return (
    <Screen>
      <ScrollView
        testID="statistics-scroll"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <WashiTape />
        <Title>{t('statisticsTitle')}</Title>

        <Segmented options={periodOptions} value={period} onChange={setPeriod} />

        <Pressable
          testID="class-dropdown"
          accessibilityRole="button"
          accessibilityLabel={`${t('chooseClass')}: ${selectedClassName}`}
          onPress={() => setClassModalVisible(true)}
          style={({ pressed }) => [styles.dropdown, pressed && styles.pressed]}
        >
          <Ionicons name="people-outline" size={18} color={colors.ink} />
          <Text style={styles.dropdownText} numberOfLines={1}>
            {selectedClassName}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.muted} />
        </Pressable>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.deepPink} />
          </View>
        ) : !stats?.hasData ? (
          <EmptyState
            icon="bar-chart-outline"
            title={t('emptyStatsTitle') as string}
            message={t('emptyStatsMessage') as string}
          />
        ) : (
          <>
            {/* Class climate */}
            <Card washi>
              <SectionLabel>{t('statsClimateSection')}</SectionLabel>
              <View style={styles.climateHead}>
                <View style={[styles.climateDot, { backgroundColor: CLIMATE_TONE[stats.climate.tone] }]} />
                <Text style={styles.climateLabel}>{t(`climateLabel_${stats.climate.status}`)}</Text>
              </View>
              <View style={styles.recommendation}>
                <Sparkle />
                <Text style={styles.recommendationText}>{t(`climateRec_${stats.climate.status}`)}</Text>
              </View>
            </Card>

            {/* Today */}
            <Card>
              <SectionLabel>{t('statsTodaySection')}</SectionLabel>
              <View style={styles.tileGrid}>
                <StatTile
                  icon="eye-outline"
                  value={stats.today.toWatch}
                  label={t('tileToWatch') as string}
                  tone={stats.today.toWatch > 0 ? colors.orangeSoft : undefined}
                />
                <StatTile
                  icon="checkmark-circle-outline"
                  value={stats.today.ticks}
                  label={t('tileTicksGiven') as string}
                />
                <StatTile
                  icon="close-circle-outline"
                  value={stats.today.crosses}
                  label={t('tileCrossesGiven') as string}
                />
                <StatTile
                  icon="book-outline"
                  value={stats.today.forgottenNotebooks}
                  label={t('tileForgotten') as string}
                  tone={stats.today.forgottenNotebooks > 0 ? colors.orangeSoft : undefined}
                />
              </View>
            </Card>

            {/* Quick action */}
            <Card>
              <SectionLabel>{t('statsQuickSection')}</SectionLabel>
              <View style={styles.quickButtons}>
                <PillButton
                  testID="quick-toWatch"
                  variant={quickList === 'toWatch' ? 'pink' : 'light'}
                  onPress={() => setQuickList('toWatch')}
                  style={styles.quickButton}
                >
                  {t('quickToWatch')}
                </PillButton>
                <PillButton
                  testID="quick-forgottenNotebooks"
                  variant={quickList === 'forgottenNotebooks' ? 'pink' : 'light'}
                  onPress={() => setQuickList('forgottenNotebooks')}
                  style={styles.quickButton}
                >
                  {t('quickForgotten')}
                </PillButton>
                <PillButton
                  testID="quick-noRecentEvent"
                  variant={quickList === 'noRecentEvent' ? 'pink' : 'light'}
                  onPress={() => setQuickList('noRecentEvent')}
                  style={styles.quickButton}
                >
                  {t('quickNoEvent')}
                </PillButton>
              </View>
              <StudentList students={quickStudents} emptyLabel={quickEmptyLabel} onSelect={openStudent} />
            </Card>

            {/* Top 3 */}
            <Card>
              <SectionLabel>{t('statsTop3Section')}</SectionLabel>
              <View style={styles.topTabs}>
                <Pressable
                  testID="top-encourage"
                  accessibilityRole="button"
                  accessibilityState={{ selected: topTab === 'encourage' }}
                  accessibilityLabel={t('topEncourageTab') as string}
                  onPress={() => setTopTab('encourage')}
                  style={({ pressed }) => [
                    styles.topTab,
                    topTab === 'encourage' && styles.topTabActive,
                    pressed && styles.pressed
                  ]}
                >
                  <Text style={[styles.topTabText, topTab === 'encourage' && styles.textOnPink]}>
                    {t('topEncourageTab')}
                  </Text>
                </Pressable>
                <Pressable
                  testID="top-reframe"
                  accessibilityRole="button"
                  accessibilityState={{ selected: topTab === 'reframe' }}
                  accessibilityLabel={t('topReframeTab') as string}
                  onPress={() => setTopTab('reframe')}
                  style={({ pressed }) => [
                    styles.topTab,
                    topTab === 'reframe' && styles.topTabActive,
                    pressed && styles.pressed
                  ]}
                >
                  <Text style={[styles.topTabText, topTab === 'reframe' && styles.textOnPink]}>
                    {t('topReframeTab')}
                  </Text>
                </Pressable>
              </View>
              <StudentList students={topStudents} emptyLabel={topEmptyLabel} onSelect={openStudent} />
            </Card>

            {/* Evolution */}
            <Card>
              <SectionLabel>{t('statsEvolutionSection')}</SectionLabel>
              <Text style={styles.evoCaption}>
                {t('evoCaption', { noun: t(PERIOD_NOUN_KEY[period]) as string })}
              </Text>
              <View style={styles.evoChart}>
                <EvolutionBar
                  label={t('evoTicks') as string}
                  value={evolution.ticks}
                  max={evolutionMax}
                  color={colors.successGreen}
                />
                <EvolutionBar
                  label={t('evoCrosses') as string}
                  value={evolution.crosses}
                  max={evolutionMax}
                  color={colors.dangerRed}
                />
                <EvolutionBar
                  label={t('evoMerits') as string}
                  value={evolution.merits}
                  max={evolutionMax}
                  color={colors.primaryPink}
                />
                <EvolutionBar
                  label={t('evoDetentions') as string}
                  value={evolution.detentions}
                  max={evolutionMax}
                  color={colors.warningOrange}
                />
              </View>
            </Card>

            {/* Trimester archives */}
            {stats.archives.length > 0 && (
              <Card>
                <SectionLabel>{t('statsArchivesSection')}</SectionLabel>
                <View style={styles.archivePills}>
                  {stats.archives.map((archive) => {
                    const active = archive.trimester === archiveTrimester;
                    return (
                      <Pressable
                        key={archive.trimester}
                        testID={`archive-${archive.trimester}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={
                          t('archiveTrimesterPill', { trimester: archive.trimester }) as string
                        }
                        onPress={() => setArchiveTrimester(active ? null : archive.trimester)}
                        style={({ pressed }) => [
                          styles.archivePill,
                          active && styles.archivePillActive,
                          pressed && styles.pressed
                        ]}
                      >
                        <Text style={[styles.archivePillText, active && styles.textOnPink]}>
                          {t('archiveTrimesterPill', { trimester: archive.trimester })}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {selectedArchive ? (
                  <View style={styles.archiveSummary}>
                    <Text style={styles.archiveSummaryText}>
                      {t('archiveSummaryText', {
                        students: selectedArchive.students,
                        merits: selectedArchive.merits,
                        detentions: selectedArchive.detentions
                      })}
                    </Text>
                    <Text style={styles.archiveSummaryMeta}>
                      {t('archiveSummaryMeta', {
                        ticks: selectedArchive.ticks,
                        crosses: selectedArchive.crosses
                      })}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.archiveHint}>{t('archiveHint')}</Text>
                )}
              </Card>
            )}
          </>
        )}
      </ScrollView>

      <SheetModal
        visible={classModalVisible}
        onRequestClose={() => setClassModalVisible(false)}
        onBackdropPress={() => setClassModalVisible(false)}
      >
        <Pressable>
          <Card style={styles.sheet} washi>
            <Text style={styles.sheetTitle}>{t('chooseClass')}</Text>
            {classOptions.map((option) => {
              const active = option.id === classId;
              return (
                <Pressable
                  key={String(option.id)}
                  testID={`class-option-${option.id ?? 'all'}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={option.name}
                  onPress={() => {
                    setClassId(option.id);
                    setClassModalVisible(false);
                  }}
                  style={({ pressed }) => [
                    styles.sheetOption,
                    active && styles.sheetOptionActive,
                    pressed && styles.pressed
                  ]}
                >
                  <Text style={[styles.sheetOptionText, active && styles.textOnPink]}>{option.name}</Text>
                  {active && <Ionicons name="checkmark" size={20} color={colors.onPrimary} />}
                </Pressable>
              );
            })}
          </Card>
        </Pressable>
      </SheetModal>
    </Screen>
  );
};

const baseText = { fontFamily: 'PatrickHand_400Regular', color: colors.ink, letterSpacing: 0 };
const bordered = { borderColor: colors.border, borderWidth: 1.5 };

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingTop: 16, paddingBottom: 96, paddingHorizontal: 16 },
  pressed: { transform: [{ scale: 0.97 }] },
  textOnPink: { color: colors.onPrimary },

  // Period segmented control
  segmented: { flexDirection: 'row', borderRadius: 999, padding: 3, gap: 2, backgroundColor: colors.card, marginBottom: 12, ...bordered },
  segment: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 999, paddingHorizontal: 8 },
  segmentActive: { backgroundColor: colors.pink },
  segmentText: { ...baseText, fontSize: 17, textTransform: 'uppercase' },

  // Class dropdown
  dropdown: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 14, marginBottom: 16, ...bordered },
  dropdownText: { ...baseText, fontSize: 19, flex: 1 },

  loading: { paddingVertical: 48, alignItems: 'center' },

  // Section labels
  sectionLabel: { marginBottom: 12 },

  // Class climate
  climateHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  climateDot: { width: 18, height: 18, borderRadius: 9, ...bordered },
  climateLabel: { ...baseText, fontSize: 24, flex: 1 },
  recommendation: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  recommendationText: { ...baseText, color: colors.muted, fontSize: 18, lineHeight: 23, flex: 1 },

  // Today tiles
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '47%', flexGrow: 1, backgroundColor: colors.canvas, borderRadius: 16, padding: 12, ...bordered },
  tileHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  tileValue: { ...baseText, fontSize: 30, lineHeight: 34 },
  tileLabel: { ...baseText, color: colors.muted, fontSize: 16, textTransform: 'uppercase' },

  // Quick action
  quickButtons: { gap: 8, marginBottom: 12 },
  quickButton: { alignSelf: 'stretch' },

  // Student rows / lists
  studentList: { gap: 8 },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, backgroundColor: colors.canvas, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 8, ...bordered },
  studentText: { flex: 1 },
  studentName: { ...baseText, fontSize: 19 },
  studentMeta: { ...baseText, color: colors.muted, fontSize: 16 },
  inlineEmpty: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  inlineEmptyText: { ...baseText, color: colors.muted, fontSize: 18, flex: 1 },

  // Top 3 tabs
  topTabs: { flexDirection: 'row', borderRadius: 999, padding: 3, gap: 2, backgroundColor: colors.card, marginBottom: 12, ...bordered },
  topTab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 999, paddingHorizontal: 8 },
  topTabActive: { backgroundColor: colors.pink },
  topTabText: { ...baseText, fontSize: 17 },

  // Evolution
  evoCaption: { ...baseText, color: colors.muted, fontSize: 16, marginBottom: 12 },
  evoChart: { gap: 12 },
  evoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  evoLabel: { ...baseText, fontSize: 17, width: 78 },
  evoTrack: { flex: 1, height: 22, borderRadius: 999, backgroundColor: colors.canvas, overflow: 'hidden', ...bordered },
  evoFill: { height: '100%', borderRadius: 999 },
  evoValue: { ...baseText, fontSize: 19, width: 30, textAlign: 'right' },

  // Archives
  archivePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  archivePill: { borderRadius: 999, minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 7, backgroundColor: colors.card, ...bordered },
  archivePillActive: { backgroundColor: colors.pink },
  archivePillText: { ...baseText, fontSize: 16, textTransform: 'uppercase' },
  archiveSummary: { gap: 4 },
  archiveSummaryText: { ...baseText, fontSize: 18, lineHeight: 23 },
  archiveSummaryMeta: { ...baseText, color: colors.muted, fontSize: 16 },
  archiveHint: { ...baseText, color: colors.muted, fontSize: 17 },

  // Class picker sheet
  sheet: { gap: 8 },
  sheetTitle: { ...baseText, fontSize: 26, marginBottom: 4 },
  sheetOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.canvas, ...bordered },
  sheetOptionActive: { backgroundColor: colors.pink },
  sheetOptionText: { ...baseText, fontSize: 19 }
});
