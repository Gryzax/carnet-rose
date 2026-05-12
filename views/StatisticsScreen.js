import { BarChart } from 'react-native-gifted-charts';
import { Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { colors } from '../constants/colors';
import { getStatistics } from '../controllers/statisticsController';
import { Screen, Title } from '../components/Themed';

export const StatisticsScreen = () => {
  const [stats, setStats] = useState({ classes: [], topParticipatifs: [], topSurveillance: [] });
  useEffect(() => { getStatistics().then(setStats); }, []);
  const chartData = stats.classes.flatMap((c) => [{ value: c.totalMerites, label: `${c.nom}\nM`, frontColor: colors.primaryPink }, { value: c.totalRetenues, label: 'R', frontColor: colors.warningOrange }]);
  const list = (title, data) => <View style={{ backgroundColor: colors.lightPink, borderRadius: 20, padding: 16, marginTop: 16 }}><Text style={{ fontWeight: '700', marginBottom: 8 }}>{title}</Text>{data.map((s, i) => <Text key={s.id}>{i + 1}. {s.prenom} {s.nom}</Text>)}</View>;
  return (
    <Screen>
      <Title>Statistiques</Title>
      <View style={{ backgroundColor: colors.white, borderRadius: 20, padding: 12 }}><BarChart data={chartData} barWidth={24} roundedTop hideRules yAxisThickness={0} xAxisThickness={0} /></View>
      {list('Top 3 participatifs', stats.topParticipatifs)}
      {list('Top 3 à surveiller', stats.topSurveillance)}
    </Screen>
  );
};
