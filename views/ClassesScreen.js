import { Ionicons } from '@expo/vector-icons';
import { FlatList, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useMemo, useState } from 'react';
import { colors } from '../constants/colors';
import { strings } from '../constants/strings';
import { ajouterClasse, supprimerClasse } from '../controllers/classController';
import { useClasses } from '../hooks/useClasses';
import { getAllStudents } from '../models/studentModel';
import { EmptyState } from '../components/EmptyState';
import { Card, IconButton, JournalInput, Pill, PillButton, Screen, SegmentedControl, Sparkle, Title } from '../components/Themed';

export const ClassesScreen = ({ navigation }) => {
  const [sort, setSort] = useState('alpha');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [className, setClassName] = useState('');
  const [addError, setAddError] = useState('');
  const [classToDelete, setClassToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { width } = useWindowDimensions();
  const { classes, refresh } = useClasses(sort);
  const columns = width >= 768 ? 2 : 1;
  const data = useMemo(() => classes, [classes]);

  const search = async (text) => {
    setQuery(text);
    const all = await getAllStudents();
    setResults(text.length < 2 ? [] : all.filter((s) => `${s.prenom} ${s.nom}`.toLowerCase().includes(text.toLowerCase())));
  };

  const openAddModal = () => {
    setClassName('');
    setAddError('');
    setAddModalVisible(true);
  };

  const closeAddModal = () => {
    if (saving) return;
    setAddModalVisible(false);
    setClassName('');
    setAddError('');
  };

  const submitClass = async () => {
    const normalizedName = className.trim();
    if (!normalizedName) {
      setAddError('Le nom de la classe est obligatoire.');
      return;
    }
    setSaving(true);
    setAddError('');
    try {
      await ajouterClasse(normalizedName);
      await refresh();
      setAddModalVisible(false);
      setClassName('');
    } catch (error) {
      setAddError(error.message || "Impossible d'ajouter la classe.");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (classe) => {
    setClassToDelete(classe);
    setDeleteError('');
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setClassToDelete(null);
    setDeleteError('');
  };

  const confirmDeleteClass = async () => {
    if (!classToDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await supprimerClasse(classToDelete);
      await refresh();
      setClassToDelete(null);
    } catch (error) {
      setDeleteError(error.message || 'Impossible de supprimer la classe.');
    } finally {
      setDeleting(false);
    }
  };

  const renderClass = ({ item }) => (
    <Pressable onPress={() => navigation.navigate('ClassDashboard', { classe: item })} onLongPress={() => openDeleteModal(item)} style={({ pressed }) => [styles.classWrap, pressed && styles.pressed]}>
      <Card washi style={styles.classCard}>
        <View style={styles.classHeader}>
          <Text style={styles.classTitle}>{item.nom}</Text>
          <IconButton icon="ellipsis-horizontal" testID={`delete-class-${item.id}`} accessibilityLabel={`Options ${item.nom}`} onPress={() => openDeleteModal(item)} />
        </View>
        <View style={styles.line}><Sparkle /><Text style={styles.meta}>{item.nombreEleves} élèves</Text></View>
        <View style={styles.stats}>
          <Pill tone="pink">Mérites {item.totalMerites}</Pill>
          <Pill>Retenues {item.totalRetenues}</Pill>
        </View>
      </Card>
    </Pressable>
  );

  return (
    <Screen>
      <Title>{strings.classesTitle}</Title>
      <JournalInput placeholder="Rechercher un élève" value={query} onChangeText={search} style={styles.search} />
      <SegmentedControl value={sort} onChange={setSort} options={[{ value: 'alpha', label: 'A-Z' }, { value: 'recent', label: 'Récent' }]} style={styles.segmented} />
      {results.map((s) => (
        <Pressable key={s.id} onPress={() => navigation.navigate('StudentDetail', { studentId: s.id })} style={({ pressed }) => [styles.result, pressed && styles.pressed]}>
          <Sparkle /><Text style={styles.resultText}>{s.prenom} {s.nom} - {s.classeNom}</Text>
        </Pressable>
      ))}
      <FlatList key={columns} data={data} numColumns={columns} keyExtractor={(item) => String(item.id)} initialNumToRender={8} getItemLayout={(_, index) => ({ length: 142, offset: 142 * index, index })} ListEmptyComponent={<EmptyState icon="basket-outline" title="Aucune classe pour l'instant" message="Appuyez sur + pour créer votre première classe" actionLabel={strings.addClass} onAction={openAddModal} />} renderItem={renderClass} />
      <Pressable accessibilityLabel={strings.addClass} testID="add-class-fab" onPress={openAddModal} style={({ pressed }) => [styles.fab, pressed && styles.pressed]}>
        <Ionicons name="add-outline" color={colors.ink} size={32} />
      </Pressable>
      <EditClassModal visible={addModalVisible} title={strings.addClass} value={className} error={addError} saving={saving} onChange={(text) => { setClassName(text); if (addError) setAddError(''); }} onClose={closeAddModal} onSubmit={submitClass} />
      <Modal visible={!!classToDelete} transparent animationType="fade" onRequestClose={closeDeleteModal}>
        <View style={styles.backdrop}>
          <Card style={styles.dialog} washi>
            <Text style={styles.modalTitle}>Supprimer la classe</Text>
            <Text style={styles.modalStrong}>{classToDelete?.nom}</Text>
            <Text style={styles.modalText}>Les élèves de cette classe, leur historique et leurs archives trimestrielles seront supprimés définitivement.</Text>
            {!!deleteError && <Text style={styles.error}>{deleteError}</Text>}
            <View style={styles.actions}>
              <PillButton testID="cancel-delete-class" disabled={deleting} onPress={closeDeleteModal} variant="light" style={styles.actionButton}>Annuler</PillButton>
              <PillButton testID="confirm-delete-class" disabled={deleting} onPress={confirmDeleteClass} variant="pink" style={styles.actionButton}>{deleting ? 'Suppression...' : 'Supprimer'}</PillButton>
            </View>
          </Card>
        </View>
      </Modal>
    </Screen>
  );
};

const EditClassModal = ({ visible, title, value, error, saving, onChange, onClose, onSubmit }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.sheetBackdrop}>
      <Card style={styles.sheet} washi>
        <Text style={styles.modalTitle}>{title}</Text>
        <JournalInput autoFocus placeholder="Nom de la classe" value={value} onChangeText={onChange} testID="add-class-name-input" />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.actions}>
          <PillButton disabled={saving} onPress={onClose} variant="light" style={styles.actionButton}>Annuler</PillButton>
          <PillButton disabled={saving} onPress={onSubmit} variant="pink" style={styles.actionButton}>{saving ? 'Ajout...' : 'Ajouter'}</PillButton>
        </View>
      </Card>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  search: { marginBottom: 12 },
  segmented: { marginBottom: 12 },
  classWrap: { flex: 1 },
  classCard: { margin: 6, minHeight: 128 },
  classHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  classTitle: { flex: 1, fontFamily: 'PatrickHand_400Regular', fontSize: 28, color: colors.ink, lineHeight: 32 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  meta: { fontFamily: 'PatrickHand_400Regular', color: colors.muted, fontSize: 18 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  resultText: { fontFamily: 'PatrickHand_400Regular', color: colors.ink, fontSize: 19 },
  fab: { position: 'absolute', right: 20, bottom: 24, backgroundColor: colors.pink, borderColor: colors.border, borderWidth: 1.5, width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  pressed: { transform: [{ scale: 0.97 }] },
  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'center', padding: 20 },
  sheetBackdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end', padding: 12 },
  sheet: { marginBottom: 0 },
  dialog: { gap: 12 },
  modalTitle: { fontFamily: 'PatrickHand_400Regular', fontSize: 28, color: colors.ink },
  modalStrong: { fontFamily: 'PatrickHand_400Regular', fontSize: 22, color: colors.ink },
  modalText: { fontFamily: 'PatrickHand_400Regular', fontSize: 19, color: colors.muted, lineHeight: 24 },
  error: { fontFamily: 'PatrickHand_400Regular', fontSize: 18, color: colors.dangerRed },
  actions: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1 }
});
