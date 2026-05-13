import { BarChart } from 'react-native-gifted-charts';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { colors } from '../constants/colors';
import { getStatistics } from '../controllers/statisticsController';
import { BackButton } from '../components/BackButton';
import { EmptyState } from '../components/EmptyState';
import { Card, Pill, Screen, Sparkle, Title } from '../components/Themed';

export const StatisticsScreen = ({ navigation }) => {
  const [stats, setStats] = useState({ classes: [], topParticipatifs: [], topSurveillance: [] });
  useEffect(() => { getStatistics().then(setStats); }, []);
  const hasData = stats.classes.some((c) => c.totalMerites > 0 || c.totalRetenues > 0) || stats.topParticipatifs.length > 0;
  const chartData = useMemo(() => stats.classes.flatMap((c) => [
    { value: c.totalMerites, label: c.nom, frontColor: colors.primaryPink, topLabelComponent: () => <Text style={styles.chartLabel}>{c.totalMerites}</Text> },
    { value: c.totalRetenues, label: '', frontColor: colors.dangerRed, topLabelComponent: () => <Text style={styles.chartLabel}>{c.totalRetenues}</Text> }
  ]), [stats.classes]);

  const list = (title, data, kind) => (
    <Card washi>
      <Pill>{title}</Pill>
      <View style={styles.listBody}>
        {data.map((s) => <View key={s.id} style={styles.line}><Sparkle /><Text style={styles.text}>{s.prenom} {s.nom} - {kind === 'mérites' ? s.merites : s.croix} {kind}</Text></View>)}
      </View>
    </Card>
  );

  return (
    <Screen>
      <BackButton navigation={navigation} fallbackRoute="Classes" />
      <Title>Statistiques</Title>
      {!hasData ? <EmptyState icon="bar-chart-outline" title="Pas encore de statistiques." message="Commencez a noter vos eleves !" /> : (
        <ScrollView testID="statistics-scroll" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Card washi>
            <BarChart data={chartData} barWidth={22} spacing={14} roundedTop hideRules yAxisThickness={0} xAxisThickness={0} xAxisLabelTextStyle={styles.axis} yAxisTextStyle={styles.axis} noOfSections={4} disableScroll />
            <View testID="chart-legend" style={styles.legend}>
              <View style={styles.legendItem}><Sparkle /><Text style={styles.text}>Mérites</Text></View>
              <View style={styles.legendItem}><Sparkle /><Text style={styles.text}>Retenues</Text></View>
            </View>
          </Card>
          {list('Top 3 participatifs', stats.topParticipatifs, 'mérites')}
          {list('Top 3 à surveiller', stats.topSurveillance, 'croix')}
        </ScrollView>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  chartLabel: { color: colors.ink, fontSize: 14, fontFamily: 'PatrickHand_400Regular' },
  scrollContent: { paddingBottom: 96 },
  axis: { color: colors.muted, fontSize: 13, fontFamily: 'PatrickHand_400Regular' },
  legend: { flexDirection: 'row', gap: 16, justifyContent: 'center', marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  listBody: { marginTop: 12, gap: 6 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { color: colors.ink, fontFamily: 'PatrickHand_400Regular', fontSize: 19 }
});
