import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { colors } from '../constants/colors';
import { getStatistics } from '../controllers/statisticsController';
import { Card, PillButton, Screen, SegmentedControl, Sparkle, Title } from '../components/Themed';

export const StatisticsScreen = ({ navigation }) => {
  const [stats, setStats] = useState({ classes: [], students: [], events: [] });
  const [period, setPeriod] = useState('week');
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [topTab, setTopTab] = useState('encourager');
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [archive, setArchive] = useState('current');

  useEffect(() => { getStatistics().then(setStats); }, []);

  const selectedClass = useMemo(
    () => stats.classes.find((classe) => String(classe.id) === String(selectedClassId)),
    [selectedClassId, stats.classes]
  );

  const filteredStudents = useMemo(
    () => (selectedClassId === 'all' ? stats.students : stats.students.filter((student) => String(student.classeId) === String(selectedClassId))),
    [selectedClassId, stats.students]
  );
  const filteredEvents = useMemo(() => {
    const studentIds = new Set(filteredStudents.map((student) => student.id));
    return stats.events.filter((event) => event.annule !== 1 && studentIds.has(event.eleveId));
  }, [filteredStudents, stats.events]);

  const now = useMemo(() => new Date(), []);
  const periodStart = useMemo(() => {
    const start = new Date(now);
    if (period === 'month') start.setDate(start.getDate() - 30);
    else if (period === 'trimester') start.setDate(start.getDate() - 90);
    else start.setDate(start.getDate() - 7);
    return start;
  }, [period, now]);

  const periodEvents = useMemo(() => filteredEvents.filter((event) => new Date(event.creeLe) >= periodStart), [filteredEvents, periodStart]);
  const todayEvents = useMemo(() => {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    return filteredEvents.filter((event) => new Date(event.creeLe) >= today);
  }, [filteredEvents, now]);

  const forgottenNotebookCount = useMemo(
    () => todayEvents.filter((event) => /(cahier|carnet|devoir|notebook|oubli)/i.test(event.raison || '')).length,
    [todayEvents]
  );

  const atRiskStudents = useMemo(
    () => filteredStudents.filter((student) => student.croix >= 2 || student.retenues > 0).length,
    [filteredStudents]
  );
  const studentsNoRecentEvents = useMemo(() => {
    const activeStudentIds = new Set(periodEvents.map((event) => event.eleveId));
    return filteredStudents.filter((student) => !activeStudentIds.has(student.id)).length;
  }, [filteredStudents, periodEvents]);

  const climate = useMemo(() => {
    const tickCount = periodEvents.filter((event) => event.type === 'tick').length;
    const crossCount = periodEvents.filter((event) => event.type === 'croix').length;
    if (!tickCount && !crossCount) {
      return { status: 'Manque de données récentes', advice: 'Multipliez les observations courtes pour calibrer la tendance.', warning: true };
    }
    const positiveRatio = tickCount / (tickCount + crossCount);
    if (positiveRatio >= 0.72) return { status: 'Climat positif et stable', advice: 'Maintenez le cap et valorisez les efforts des élèves discrets.' };
    if (positiveRatio >= 0.5) return { status: 'Climat stable', advice: 'Renforcez les encouragements ciblés en début de séance.' };
    if (positiveRatio >= 0.35) return { status: "Climat à surveiller", advice: 'Planifiez un rappel collectif des attentes puis récompensez vite les progrès.', warning: true };
    return { status: 'Climat tendu', advice: 'Priorisez 3 élèves à recadrer puis valorisez immédiatement les comportements attendus.', warning: true };
  }, [periodEvents]);

  const topEncourager = useMemo(
    () => [...filteredStudents].sort((a, b) => (b.merites * 4 + b.ticks) - (a.merites * 4 + a.ticks)).slice(0, 3),
    [filteredStudents]
  );
  const topRecadrer = useMemo(
    () => [...filteredStudents].sort((a, b) => (b.retenues * 4 + b.croix) - (a.retenues * 4 + a.croix)).slice(0, 3),
    [filteredStudents]
  );

  const evolution = useMemo(() => {
    const totals = {
      ticks: filteredStudents.reduce((sum, student) => sum + student.ticks, 0),
      croix: filteredStudents.reduce((sum, student) => sum + student.croix, 0),
      merites: filteredStudents.reduce((sum, student) => sum + student.merites, 0),
      retenues: filteredStudents.reduce((sum, student) => sum + student.retenues, 0)
    };
    const max = Math.max(1, totals.ticks, totals.croix, totals.merites, totals.retenues);
    return [
      { key: 'ticks', label: 'Ticks', value: totals.ticks, color: '#D6E6CF', max },
      { key: 'croix', label: 'Croix', value: totals.croix, color: '#F7C6D8', max },
      { key: 'merites', label: 'Mérites', value: totals.merites, color: '#BFD9B8', max },
      { key: 'retenues', label: 'Retenues', value: totals.retenues, color: '#F5B77B', max }
    ];
  }, [filteredStudents]);

  const archiveOptions = useMemo(() => {
    const trimestres = [...new Set(stats.students.map((student) => student.trimestreActuel).filter(Boolean))].sort((a, b) => b - a);
    return ['current', ...trimestres.map((trimestre) => `t${trimestre}`)];
  }, [stats.students]);

  const handleQuickAction = () => {
    if (selectedClass) navigation.navigate('ClassDashboard', { classe: selectedClass });
    else navigation.navigate('Classes');
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView testID="statistics-scroll" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Title>Statistiques</Title>

        <SegmentedControl
          style={styles.segmented}
          value={period}
          onChange={setPeriod}
          options={[{ value: 'week', label: 'Semaine' }, { value: 'month', label: 'Mois' }, { value: 'trimester', label: 'Trimestre' }]}
        />

        <View style={styles.dropdownWrap}>
          <Pressable testID="class-dropdown" style={({ pressed }) => [styles.dropdown, pressed && styles.pressed]} onPress={() => setShowClassPicker((open) => !open)}>
            <Text style={styles.dropdownText}>{selectedClass?.nom || 'Toutes les classes'}</Text>
            <Text style={styles.dropdownChevron}>▾</Text>
          </Pressable>
          {showClassPicker && (
            <Card style={styles.dropdownCard}>
              <Pressable onPress={() => { setSelectedClassId('all'); setShowClassPicker(false); }} style={styles.dropdownOption}><Text style={styles.text}>Toutes les classes</Text></Pressable>
              {stats.classes.map((classe) => (
                <Pressable key={classe.id} onPress={() => { setSelectedClassId(classe.id); setShowClassPicker(false); }} style={styles.dropdownOption}>
                  <Text style={styles.text}>{classe.nom}</Text>
                </Pressable>
              ))}
            </Card>
          )}
        </View>

        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>Climat de classe</Text>
          <Text style={[styles.status, climate.warning && styles.warningText]}>{climate.status}</Text>
          <Text style={styles.text}>{climate.advice}</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>Aujourd&apos;hui</Text>
          <View style={styles.metricGrid}>
            <View style={styles.metric}><Text style={styles.metricValue}>{atRiskStudents}</Text><Text style={styles.metricLabel}>Élèves à surveiller</Text></View>
            <View style={styles.metric}><Text style={styles.metricValue}>{todayEvents.filter((event) => event.type === 'tick').length}</Text><Text style={styles.metricLabel}>Ticks donnés</Text></View>
            <View style={styles.metric}><Text style={styles.metricValue}>{todayEvents.filter((event) => event.type === 'croix').length}</Text><Text style={styles.metricLabel}>Croix données</Text></View>
            <View style={styles.metric}><Text style={styles.metricValue}>{forgottenNotebookCount}</Text><Text style={styles.metricLabel}>Cahiers oubliés</Text></View>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>Action rapide</Text>
          <View style={styles.actions}>
            <PillButton testID="quick-watch" onPress={handleQuickAction} variant="light" style={styles.actionButton}>Voir les élèves à surveiller ({atRiskStudents})</PillButton>
            <PillButton testID="quick-notebooks" onPress={handleQuickAction} variant="light" style={styles.actionButton}>Voir les cahiers oubliés ({forgottenNotebookCount})</PillButton>
            <PillButton testID="quick-inactive" onPress={handleQuickAction} variant="light" style={styles.actionButton}>Sans événement récent ({studentsNoRecentEvents})</PillButton>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>Top 3</Text>
          <SegmentedControl
            value={topTab}
            onChange={setTopTab}
            style={styles.segmented}
            options={[{ value: 'encourager', label: 'À encourager' }, { value: 'recadrer', label: 'À recadrer' }]}
          />
          <View style={styles.listBody}>
            {(topTab === 'encourager' ? topEncourager : topRecadrer).map((student, index) => (
              <View key={student.id} style={styles.line}>
                <Sparkle />
                <Text style={styles.text}>{index + 1}. {student.prenom} {student.nom} - {topTab === 'encourager' ? student.merites : student.croix}</Text>
              </View>
            ))}
            {!filteredStudents.length && <Text style={styles.text}>Aucun élève pour cette sélection.</Text>}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>Évolution</Text>
          <View testID="evolution-chart" style={styles.chart}>
            {evolution.map((item) => (
              <View key={item.key} style={styles.barRow}>
                <Text style={styles.barLabel}>{item.label}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${(item.value / item.max) * 100}%`, backgroundColor: item.color }]} />
                </View>
                <Text style={styles.barValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </Card>

        {archiveOptions.length > 1 && (
          <Card style={styles.card}>
            <Text style={styles.sectionLabel}>Archives trimestrielles</Text>
            <SegmentedControl
              style={styles.segmented}
              value={archive}
              onChange={setArchive}
              options={archiveOptions.slice(0, 3).map((option) => ({ value: option, label: option === 'current' ? 'En cours' : option.toUpperCase() }))}
            />
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: { backgroundColor: '#FBE8D5' },
  scrollContent: { flexGrow: 1, paddingBottom: 116 },
  segmented: { marginBottom: 10, borderColor: colors.ink, borderWidth: 1.2, backgroundColor: '#FFFDFB' },
  dropdownWrap: { marginBottom: 12 },
  dropdown: { minHeight: 46, borderRadius: 16, borderWidth: 1.2, borderColor: colors.ink, backgroundColor: '#FFFDFB', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownCard: { marginTop: 8, borderColor: colors.ink, borderWidth: 1.2, backgroundColor: '#FFFDFB' },
  dropdownOption: { paddingVertical: 8 },
  dropdownText: { color: colors.ink, fontFamily: 'PatrickHand_400Regular', fontSize: 21 },
  dropdownChevron: { color: colors.ink, fontFamily: 'PatrickHand_400Regular', fontSize: 22 },
  card: { borderColor: colors.ink, borderWidth: 1.2, backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 12 },
  sectionLabel: { alignSelf: 'flex-start', backgroundColor: '#C8D9C1', borderColor: colors.ink, borderWidth: 1.2, borderRadius: 999, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 4, color: colors.ink, fontFamily: 'PatrickHand_400Regular', fontSize: 16, marginBottom: 8, textTransform: 'uppercase' },
  status: { color: colors.ink, fontFamily: 'PatrickHand_400Regular', fontSize: 25, marginBottom: 6 },
  warningText: { color: '#D27C2C' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: { width: '48%', borderWidth: 1.1, borderColor: colors.ink, borderRadius: 12, backgroundColor: '#FFFDFB', padding: 10 },
  metricValue: { color: colors.ink, fontFamily: 'PatrickHand_400Regular', fontSize: 28, lineHeight: 30 },
  metricLabel: { color: colors.muted, fontFamily: 'PatrickHand_400Regular', fontSize: 17 },
  actions: { gap: 8 },
  actionButton: { borderColor: colors.ink, borderWidth: 1.2, backgroundColor: '#FFFDFB' },
  listBody: { marginTop: 12, gap: 6 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { color: colors.ink, fontFamily: 'PatrickHand_400Regular', fontSize: 19 },
  chart: { gap: 10, marginTop: 8 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 62, color: colors.ink, fontFamily: 'PatrickHand_400Regular', fontSize: 17 },
  barTrack: { flex: 1, height: 12, borderRadius: 999, borderWidth: 1, borderColor: colors.ink, backgroundColor: '#FFFDFB', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  barValue: { width: 24, textAlign: 'right', color: colors.ink, fontFamily: 'PatrickHand_400Regular', fontSize: 17 },
  pressed: { transform: [{ scale: 0.98 }] }
});
