import { FlatList, Modal, StyleSheet, Text, View } from 'react-native';
import { useMemo, useState } from 'react';
import { colors } from '../constants/colors';
import { ajouterEleve, supprimerEleve } from '../controllers/studentController';
import { BackButton } from '../components/BackButton';
import { EmptyState } from '../components/EmptyState';
import { StudentCard } from '../components/StudentCard';
import { Card, JournalInput, PillButton, Screen, SegmentedControl, Sparkle, Title } from '../components/Themed';
import { useStudents } from '../hooks/useStudents';

export const ClassDashboardScreen = ({ route, navigation }) => {
  const { classe } = route.params;
  const [sort, setSort] = useState('nom');
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [studentFirstName, setStudentFirstName] = useState('');
  const [studentLastName, setStudentLastName] = useState('');
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { students, refresh } = useStudents(classe.id, sort);
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

  const closeAddModal = () => {
    if (saving) return;
    setAddModalVisible(false);
    setStudentFirstName('');
    setStudentLastName('');
    setAddError('');
  };

  const submitStudent = async () => {
    setSaving(true);
    setAddError('');
    try {
      await ajouterEleve({ classeId: classe.id, prenom: studentFirstName, nom: studentLastName });
      await refresh();
      setAddModalVisible(false);
      setStudentFirstName('');
      setStudentLastName('');
    } catch (error) {
      setAddError(error.message || "Impossible d'ajouter l'eleve.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <BackButton navigation={navigation} fallbackRoute="ClassesHome" />
      <View style={styles.header}>
        <Title style={styles.title}>{classe.nom}</Title>
        <View style={styles.metaLine}><Sparkle /><Text style={styles.meta}>{students.length} élèves - {atRisk} élèves à risque</Text></View>
      </View>
      <SegmentedControl value={sort} onChange={setSort} options={[{ value: 'nom', label: 'Nom' }, { value: 'croix', label: 'Croix' }, { value: 'ticks', label: 'Ticks' }]} style={styles.segmented} />
      <FlatList
        data={students}
        keyExtractor={(item) => String(item.id)}
        initialNumToRender={10}
        getItemLayout={(_, index) => ({ length: 174, offset: 174 * index, index })}
        ListEmptyComponent={<EmptyState icon="people-outline" title="Aucun élève dans cette classe" message="Ajoutez votre premier élève pour commencer." actionLabel="Ajouter un élève" onAction={() => setAddModalVisible(true)} />}
        renderItem={({ item }) => <StudentCard student={item} onPress={() => navigation.navigate('StudentDetail', { studentId: item.id })} onDelete={() => setStudentToDelete(item)} />}
      />
      <PillButton onPress={() => setAddModalVisible(true)} variant="pink" style={styles.add}>Ajouter un élève</PillButton>
      <Modal visible={addModalVisible} transparent animationType="slide" onRequestClose={closeAddModal}>
        <View style={styles.sheetBackdrop}>
          <Card style={styles.sheet} washi>
            <Text style={styles.modalTitle}>Ajouter un élève</Text>
            <JournalInput placeholder="Prénom" value={studentFirstName} onChangeText={setStudentFirstName} />
            <JournalInput placeholder="Nom" value={studentLastName} onChangeText={setStudentLastName} />
            {!!addError && <Text style={styles.error}>{addError}</Text>}
            <View style={styles.actions}>
              <PillButton testID="cancel-add-student" disabled={saving} onPress={closeAddModal} variant="light" style={styles.actionButton}>Annuler</PillButton>
              <PillButton disabled={saving} onPress={submitStudent} variant="pink" style={styles.actionButton}>{saving ? 'Ajout...' : 'Ajouter'}</PillButton>
            </View>
          </Card>
        </View>
      </Modal>
      <Modal visible={!!studentToDelete} transparent animationType="fade" onRequestClose={() => setStudentToDelete(null)}>
        <View style={styles.backdrop}>
          <Card style={styles.dialog} washi>
            <Text style={styles.modalTitle}>Supprimer l'élève</Text>
            <Text style={styles.modalStrong}>{studentToDelete?.prenom} {studentToDelete?.nom}</Text>
            <Text style={styles.modalText}>Son historique et ses archives trimestrielles seront supprimés définitivement.</Text>
            <View style={styles.actions}>
              <PillButton testID="cancel-delete-student" disabled={deleting} onPress={() => setStudentToDelete(null)} variant="light" style={styles.actionButton}>Annuler</PillButton>
              <PillButton testID="confirm-delete-student" disabled={deleting} onPress={confirmDeleteStudent} variant="pink" style={styles.actionButton}>{deleting ? 'Suppression...' : 'Supprimer'}</PillButton>
            </View>
          </Card>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: { marginBottom: 14 },
  title: { marginBottom: 4 },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { fontFamily: 'PatrickHand_400Regular', color: colors.muted, fontSize: 19 },
  segmented: { marginBottom: 12 },
  add: { marginTop: 8 },
  sheetBackdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end', padding: 12 },
  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'center', padding: 20 },
  sheet: { gap: 12 },
  dialog: { gap: 12 },
  modalTitle: { fontFamily: 'PatrickHand_400Regular', fontSize: 28, color: colors.ink },
  modalStrong: { fontFamily: 'PatrickHand_400Regular', fontSize: 22, color: colors.ink },
  modalText: { fontFamily: 'PatrickHand_400Regular', fontSize: 19, color: colors.muted, lineHeight: 24 },
  error: { fontFamily: 'PatrickHand_400Regular', fontSize: 18, color: colors.dangerRed },
  actions: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1 }
});
