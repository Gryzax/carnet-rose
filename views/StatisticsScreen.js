import { BarChart } from 'react-native-gifted-charts';
import { Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { colors } from '../constants/colors';
import { getStatistics } from '../controllers/statisticsController';
import { EmptyState } from '../components/EmptyState';
import { Screen, Title, useThemeColors } from '../components/Themed';

export const StatisticsScreen = () => {
  const [stats, setStats] = useState({ classes: [], topParticipatifs: [], topSurveillance: [] });
  const theme = useThemeColors();
  useEffect(() => { getStatistics().then(setStats); }, []);
  const hasData = stats.classes.some((c) => c.totalMerites > 0 || c.totalRetenues > 0) || stats.topParticipatifs.length > 0;
  const chartData = useMemo(() => stats.classes.flatMap((c) => [
    { value: c.totalMerites, label: c.nom, frontColor: colors.primaryPink, topLabelComponent: () => <Text style={{ color: theme.text, fontSize: 12 }}>{c.totalMerites}</Text> },
    { value: c.totalRetenues, label: '', frontColor: colors.dangerRed, topLabelComponent: () => <Text style={{ color: theme.text, fontSize: 12 }}>{c.totalRetenues}</Text> }
  ]), [stats.classes, theme.text]);

  const list = (title, data, kind) => (
    <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 16, marginTop: 16 }}>
      <Text style={{ color: theme.text, fontFamily: 'Nunito_800ExtraBold', fontSize: 18, marginBottom: 8 }}>{title}</Text>
      {data.map((s) => <Text key={s.id} style={{ color: theme.text, marginBottom: 6 }}>{s.prenom} {s.nom} - {kind === 'mérites' ? s.merites : s.croix} {kind}</Text>)}
    </View>
  );

  return (
    <Screen>
      <Title>Statistiques</Title>
      {!hasData ? <EmptyState icon="bar-chart-outline" title="Pas encore de statistiques." message="Commencez à noter vos élèves !" /> : (
        <>
          <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 12 }}>
            <BarChart data={chartData} barWidth={22} spacing={14} roundedTop hideRules yAxisThickness={0} xAxisThickness={0} xAxisLabelTextStyle={{ color: theme.muted, fontSize: 10 }} yAxisTextStyle={{ color: theme.muted }} noOfSections={4} />
            <View testID="chart-legend" style={{ flexDirection: 'row', gap: 16, justifyContent: 'center', marginTop: 12 }}>
              <Text style={{ color: theme.text }}><Text style={{ color: colors.primaryPink }}>●</Text> Mérites</Text>
              <Text style={{ color: theme.text }}><Text style={{ color: colors.dangerRed }}>●</Text> Retenues</Text>
            </View>
          </View>
          {list('Top 3 participatifs', stats.topParticipatifs, 'mérites')}
          {list('Top 3 à surveiller', stats.topSurveillance, 'croix')}
        </>
      )}
    </Screen>
  );
};
