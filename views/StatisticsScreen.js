import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import { memo, useEffect, useMemo, useState } from 'react';
import { colors } from '../constants/colors';
import { getStatistics } from '../controllers/statisticsController';
import { BackButton } from '../components/BackButton';
import { EmptyState } from '../components/EmptyState';
import { Card, Screen, Title } from '../components/Themed';

const emptyStats = {
  totals: { totalEleves: 0, totalMerites: 0, totalRetenues: 0, elevesARisque: 0 },
  classes: [],
  topParticipatifs: [],
  topSurveillance: []
};

const createPalette = (scheme) => {
  const dark = scheme === 'dark';
  return {
    background: dark ? colors.darkBg : colors.canvas,
    card: dark ? colors.darkCard : colors.white,
    softCard: dark ? '#3A1B2A' : colors.lightPink,
    dangerCard: dark ? '#3A171A' : '#FFF1F2',
    text: dark ? '#FFF5F9' : colors.ink,
    muted: dark ? '#E9B8CA' : colors.muted,
    border: dark ? '#5A2A3E' : colors.border,
    shadow: dark ? 'rgba(0,0,0,0.3)' : 'rgba(219,39,119,0.12)'
  };
};

const StatCard = memo(({ icon, value, label, tone, palette, basis }) => (
  <View testID={`summary-card-${label}`} style={[styles.summaryCard, { flexBasis: basis, backgroundColor: palette.card, borderColor: palette.border, shadowColor: palette.shadow }]}>
    <View style={[styles.summaryIcon, { backgroundColor: tone }]}>
      <Ionicons name={icon} color={colors.textDark} size={20} />
    </View>
    <Text style={[styles.summaryValue, { color: palette.text }]}>{value}</Text>
    <Text style={[styles.summaryLabel, { color: palette.muted }]}>{label}</Text>
  </View>
));

const LegendDot = ({ color, label, palette }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={[styles.legendText, { color: palette.text }]}>{label}</Text>
  </View>
);

const BarRow = memo(({ classe, maxValue, palette }) => {
  const merits = Number(classe.totalMerites || 0);
  const detentions = Number(classe.totalRetenues || 0);
  const meritWidth = `${Math.max((merits / maxValue) * 100, merits > 0 ? 8 : 0)}%`;
  const detentionWidth = `${Math.max((detentions / maxValue) * 100, detentions > 0 ? 8 : 0)}%`;

  return (
    <View testID={`class-chart-${classe.id || classe.nom}`} style={styles.chartRow}>
      <View style={styles.chartHeader}>
        <Text numberOfLines={2} style={[styles.className, { color: palette.text }]}>{classe.nom}</Text>
        <Text style={[styles.classMeta, { color: palette.muted }]}>{classe.nombreEleves || 0} eleves</Text>
      </View>
      <View style={styles.barLine}>
        <Text style={[styles.barLabel, { color: palette.muted }]}>Merites</Text>
        <View style={[styles.barTrack, { backgroundColor: palette.softCard }]}>
          <View style={[styles.barFill, { width: meritWidth, backgroundColor: colors.primaryPink }]} />
        </View>
        <Text style={[styles.barValue, { color: palette.text }]}>{merits}</Text>
      </View>
      <View style={styles.barLine}>
        <Text style={[styles.barLabel, { color: palette.muted }]}>Retenues</Text>
        <View style={[styles.barTrack, { backgroundColor: palette.softCard }]}>
          <View style={[styles.barFill, { width: detentionWidth, backgroundColor: colors.dangerRed }]} />
        </View>
        <Text style={[styles.barValue, { color: palette.text }]}>{detentions}</Text>
      </View>
    </View>
  );
});

const RankingCard = memo(({ title, icon, data, emptyText, mode, palette }) => (
  <Card style={[styles.rankingCard, { backgroundColor: mode === 'risk' ? palette.dangerCard : palette.softCard, borderColor: palette.border }]}>
    <View style={styles.cardTitleRow}>
      <Ionicons name={icon} color={mode === 'risk' ? '#B91C1C' : colors.deepPink} size={20} />
      <Text style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>
    </View>
    {data.length === 0 ? (
      <Text style={[styles.emptyLine, { color: palette.muted }]}>{emptyText}</Text>
    ) : data.map((student, index) => (
      <View key={student.id || `${student.prenom}-${student.nom}`} style={[styles.rankLine, { borderColor: palette.border }]}>
        <View style={[styles.rankBadge, { backgroundColor: mode === 'risk' ? colors.dangerRed : colors.softPink }]}>
          <Text style={styles.rankNumber}>{index + 1}</Text>
        </View>
        <Text style={[styles.rankText, { color: palette.text }]}>
          {student.prenom} {student.nom} - {mode === 'risk' ? `${student.croix || 0} croix - ${student.retenues || 0} retenues` : `${student.merites || 0} merites`}
        </Text>
      </View>
    ))}
  </Card>
));

const ClassDetail = memo(({ classe, palette }) => (
  <View testID={`class-detail-${classe.id || classe.nom}`} style={[styles.classDetail, { borderColor: palette.border }]}>
    <View style={styles.classDetailTop}>
      <Text numberOfLines={2} style={[styles.className, { color: palette.text }]}>{classe.nom}</Text>
      <Text style={[styles.classMeta, { color: palette.muted }]}>{classe.nombreEleves || 0} eleves</Text>
    </View>
    <View style={styles.badgeRow}>
      <Text style={[styles.metricBadge, styles.meritBadge]}>Merites {classe.totalMerites || 0}</Text>
      <Text style={[styles.metricBadge, styles.detentionBadge]}>Retenues {classe.totalRetenues || 0}</Text>
      <Text style={[styles.metricBadge, styles.riskBadge]}>A risque {classe.elevesARisque || 0}</Text>
    </View>
  </View>
));

export const StatisticsScreen = ({ navigation }) => {
  const [stats, setStats] = useState(emptyStats);
  const scheme = useColorScheme();
  const palette = useMemo(() => createPalette(scheme), [scheme]);
  const { width } = useWindowDimensions();
  const summaryBasis = width >= 720 ? '23%' : '47%';

  useEffect(() => { getStatistics().then((next) => setStats({ ...emptyStats, ...next, totals: { ...emptyStats.totals, ...next.totals } })); }, []);

  const hasData = stats.totals.totalEleves > 0 || stats.totals.totalMerites > 0 || stats.totals.totalRetenues > 0 || stats.classes.length > 0;
  const maxValue = useMemo(() => Math.max(1, ...stats.classes.flatMap((classe) => [classe.totalMerites || 0, classe.totalRetenues || 0])), [stats.classes]);
  const summaryCards = useMemo(() => [
    { icon: 'people-outline', value: stats.totals.totalEleves, label: 'Total eleves', tone: colors.lightPink },
    { icon: 'sparkles-outline', value: stats.totals.totalMerites, label: 'Total merites', tone: colors.primaryPink },
    { icon: 'alert-circle-outline', value: stats.totals.totalRetenues, label: 'Total retenues', tone: colors.dangerRed },
    { icon: 'eye-outline', value: stats.totals.elevesARisque, label: 'A surveiller', tone: colors.warningOrange }
  ], [stats.totals]);

  return (
    <Screen style={{ backgroundColor: palette.background }}>
      <ScrollView testID="statistics-scroll" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <BackButton navigation={navigation} fallbackRoute="Classes" />
        <View style={[styles.hero, { backgroundColor: palette.softCard, borderColor: palette.border }]}>
          <Title style={[styles.title, { color: colors.deepPink }]}>Statistiques</Title>
          <Text style={[styles.subtitle, { color: palette.text }]}>Vue d'ensemble du trimestre en cours</Text>
          <Text style={[styles.helper, { color: palette.muted }]}>Suivez les merites, retenues et eleves a surveiller.</Text>
        </View>

        {!hasData ? (
          <EmptyState icon="bar-chart-outline" title="Pas encore de statistiques" message="Ajoutez des classes et des eleves pour commencer a suivre vos donnees." />
        ) : (
          <>
            <View testID="summary-grid" style={styles.summaryGrid}>
              {summaryCards.map((item) => <StatCard key={item.label} {...item} palette={palette} basis={summaryBasis} />)}
            </View>

            <Card style={[styles.chartCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Merites vs retenues par classe</Text>
              <View testID="chart-legend" style={styles.legend}>
                <LegendDot color={colors.primaryPink} label="Merites" palette={palette} />
                <LegendDot color={colors.dangerRed} label="Retenues" palette={palette} />
              </View>
              <View style={styles.chartBody}>
                {stats.classes.map((classe) => <BarRow key={classe.id || classe.nom} classe={classe} maxValue={maxValue} palette={palette} />)}
              </View>
            </Card>

            <View style={styles.rankGrid}>
              <RankingCard title="Top 3 participatifs" icon="sparkles-outline" data={stats.topParticipatifs} emptyText="Aucun merite pour le moment." mode="merit" palette={palette} />
              <RankingCard title="Top 3 a surveiller" icon="warning-outline" data={stats.topSurveillance} emptyText="Aucun eleve a surveiller pour le moment." mode="risk" palette={palette} />
            </View>

            <Card style={[styles.detailCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Detail par classe</Text>
              <View style={styles.detailList}>
                {stats.classes.map((classe) => <ClassDetail key={classe.id || classe.nom} classe={classe} palette={palette} />)}
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingBottom: 116, gap: 16 },
  hero: { borderRadius: 20, borderWidth: 1.5, padding: 18 },
  title: { marginBottom: 2 },
  subtitle: { fontFamily: 'PatrickHand_400Regular', fontSize: 24, lineHeight: 28 },
  helper: { fontFamily: 'PatrickHand_400Regular', fontSize: 19, lineHeight: 24, marginTop: 4 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: { flexGrow: 1, minWidth: 140, borderWidth: 1.5, borderRadius: 20, padding: 14, shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  summaryIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  summaryValue: { fontFamily: 'PatrickHand_400Regular', fontSize: 34, lineHeight: 38 },
  summaryLabel: { fontFamily: 'PatrickHand_400Regular', fontSize: 18, lineHeight: 22 },
  chartCard: { borderRadius: 20, borderWidth: 1.5, padding: 16 },
  sectionTitle: { fontFamily: 'PatrickHand_400Regular', fontSize: 25, lineHeight: 30 },
  legend: { flexDirection: 'row', gap: 18, marginTop: 10, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontFamily: 'PatrickHand_400Regular', fontSize: 18 },
  chartBody: { gap: 14 },
  chartRow: { gap: 7 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  className: { flex: 1, fontFamily: 'PatrickHand_400Regular', fontSize: 22, lineHeight: 26 },
  classMeta: { fontFamily: 'PatrickHand_400Regular', fontSize: 17, lineHeight: 22 },
  barLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 66, fontFamily: 'PatrickHand_400Regular', fontSize: 16 },
  barTrack: { flex: 1, height: 14, borderRadius: 999, overflow: 'hidden' },
  barFill: { minHeight: 14, borderRadius: 999 },
  barValue: { width: 28, textAlign: 'right', fontFamily: 'PatrickHand_400Regular', fontSize: 18 },
  rankGrid: { gap: 14 },
  rankingCard: { borderRadius: 20, borderWidth: 1.5, padding: 16 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  emptyLine: { fontFamily: 'PatrickHand_400Regular', fontSize: 19, lineHeight: 24 },
  rankLine: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, paddingTop: 10, marginTop: 10 },
  rankBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  rankNumber: { color: colors.textDark, fontFamily: 'PatrickHand_400Regular', fontSize: 18 },
  rankText: { flex: 1, fontFamily: 'PatrickHand_400Regular', fontSize: 20, lineHeight: 24 },
  detailCard: { borderRadius: 20, borderWidth: 1.5, padding: 16 },
  detailList: { gap: 12, marginTop: 12 },
  classDetail: { borderWidth: 1.5, borderRadius: 16, padding: 12 },
  classDetailTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  metricBadge: { overflow: 'hidden', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontFamily: 'PatrickHand_400Regular', fontSize: 16, color: colors.textDark },
  meritBadge: { backgroundColor: colors.softPink },
  detentionBadge: { backgroundColor: colors.dangerRed },
  riskBadge: { backgroundColor: colors.warningOrange }
});
