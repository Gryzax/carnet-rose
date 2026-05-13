import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import { useMemo, useState } from 'react';
import { colors } from '../constants/colors';
import { supprimerEleve } from '../controllers/studentController';
import { EmptyState } from '../components/EmptyState';
import { StudentCard } from '../components/StudentCard';
import { PillButton, Screen, Title, useThemeColors } from '../components/Themed';
import { useStudents } from '../hooks/useStudents';

export const ClassDashboardScreen = ({ route, navigation }) => {
  const { classe } = route.params;
  const [sort, setSort] = useState('nom');
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { students, refresh } = useStudents(classe.id, sort);
  const theme = useThemeColors();
  const atRisk = useMemo(() => students.filter((s) => s.croix >= 2).length, [students]);

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    setDeleting(true);
    try {
      await supprimerEleve(studentToDelete);
      await refresh();
      setStudentToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Screen>
      <View style={{ marginBottom: 14 }}>
        <Title>{classe.nom}</Title>
        <Text style={{ color: theme.muted }}>{students.length} élèves - {atRisk} élèves à risque</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {[['nom', 'Nom'], ['croix', 'Croix'], ['ticks', 'Ticks']].map(([key, label]) => (
          <TouchableOpacity key={key} onPress={() => setSort(key)} style={{ borderRadius: 50, padding: 10, backgroundColor: sort === key ? colors.primaryPink : colors.lightPink }}>
            <Text style={{ color: sort === key ? colors.white : colors.deepPink, fontFamily: 'NunitoSans_700Bold' }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={students}
        keyExtractor={(item) => String(item.id)}
        initialNumToRender={10}
        getItemLayout={(_, index) => ({ length: 164, offset: 164 * index, index })}
        ListEmptyComponent={<EmptyState icon="people-outline" title="Aucun élève dans cette classe" message="Ajoutez votre premier élève pour commencer." actionLabel="Ajouter un élève" onAction={() => {}} />}
        renderItem={({ item }) => <StudentCard student={item} onPress={() => navigation.navigate('StudentDetail', { studentId: item.id })} onDelete={() => setStudentToDelete(item)} />}
      />
      <PillButton style={{ marginTop: 8 }}>Ajouter un élève</PillButton>
      <Modal visible={!!studentToDelete} transparent animationType="fade" onRequestClose={() => setStudentToDelete(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 20, padding: 20, gap: 12 }}>
            <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 22, color: theme.text }}>Supprimer l'élève</Text>
            <Text style={{ fontFamily: 'NunitoSans_700Bold', fontSize: 17, color: theme.text }}>{studentToDelete?.prenom} {studentToDelete?.nom}</Text>
            <Text style={{ color: theme.muted, lineHeight: 20 }}>Son historique et ses archives trimestrielles seront supprimés définitivement.</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity testID="cancel-delete-student" disabled={deleting} onPress={() => setStudentToDelete(null)} style={{ backgroundColor: colors.lightPink, borderRadius: 50, paddingVertical: 12, paddingHorizontal: 18 }}>
                <Text style={{ color: colors.deepPink, fontFamily: 'NunitoSans_700Bold' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="confirm-delete-student" disabled={deleting} onPress={confirmDeleteStudent} style={{ backgroundColor: colors.deepPink, borderRadius: 50, paddingVertical: 12, paddingHorizontal: 18, opacity: deleting ? 0.7 : 1 }}>
                <Text style={{ color: colors.white, fontFamily: 'NunitoSans_700Bold' }}>{deleting ? 'Suppression...' : 'Supprimer'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};
