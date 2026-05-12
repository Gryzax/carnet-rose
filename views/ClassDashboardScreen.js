import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useMemo, useState } from 'react';
import { colors } from '../constants/colors';
import { StudentCard } from '../components/StudentCard';
import { PillButton, Screen, Title, useThemeColors } from '../components/Themed';
import { useStudents } from '../hooks/useStudents';

export const ClassDashboardScreen = ({ route, navigation }) => {
  const { classe } = route.params;
  const [sort, setSort] = useState('nom');
  const { students } = useStudents(classe.id, sort);
  const theme = useThemeColors();
  const atRisk = useMemo(() => students.filter((s) => s.croix >= 2).length, [students]);
  return (
    <Screen>
      <Title>{classe.nom}</Title>
      <Text style={{ color: theme.muted, marginBottom: 10 }}>{atRisk} élèves à risque</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>{['nom', 'croix', 'ticks'].map((s) => <TouchableOpacity key={s} onPress={() => setSort(s)} style={{ borderRadius: 50, padding: 10, backgroundColor: sort === s ? colors.primaryPink : colors.lightPink }}><Text style={{ color: sort === s ? colors.white : colors.deepPink }}>{s}</Text></TouchableOpacity>)}</View>
      <FlatList data={students} keyExtractor={(item) => String(item.id)} initialNumToRender={10} getItemLayout={(_, index) => ({ length: 150, offset: 150 * index, index })} renderItem={({ item }) => <StudentCard student={item} onPress={() => navigation.navigate('StudentDetail', { studentId: item.id })} />} />
      <PillButton style={{ marginTop: 8 }}>Ajouter un élève</PillButton>
    </Screen>
  );
};
