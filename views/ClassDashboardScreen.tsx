import { FlatList, Modal, StyleSheet, Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import { addStudent, updateStudent, deleteStudent } from '../controllers/studentController';
import { markClassUsed } from '../controllers/classController';
import { BackButton } from '../components/BackButton';
import { EmptyState } from '../components/EmptyState';
import { SheetModal } from '../components/SheetModal';
import { StudentCard } from '../components/StudentCard';
import { Card, JournalInput, PillButton, Screen, SegmentedControl, Sparkle, Title, WashiTape } from '../components/Themed';
import { useStudents, type StudentSort } from '../hooks/useStudents';
import { useT } from '../utils/i18n';
import type { ClassesStackParamList } from '../navigation/types';
import type { StudentRow } from '../types/domain';

type Props = NativeStackScreenProps<ClassesStackParamList, 'ClassDashboard'>;

export const ClassDashboardScreen = ({ route, navigation }: Props) => {
  const { t } = useT();
  const { classRow } = route.params;
  const [sort, setSort] = useState<StudentSort>('name');
  const [studentToDelete, setStudentToDelete] = useState<StudentRow | null>(null);
  const [menuStudent, setMenuStudent] = useState<StudentRow | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<StudentRow | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [studentFirstName, setStudentFirstName] = useState('');
  const [studentLastName, setStudentLastName] = useState('');
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const { students } = useStudents(classRow.id, sort);
  const atRisk = useMemo(() => students.filter((s) => s.crosses >= 2).length, [students]);

  useEffect(() => {
    markClassUsed(classRow);
  }, [classRow]);

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    setDeleting(true);
    try {
      await deleteStudent(studentToDelete);
      setStudentToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (student: StudentRow) => {
    setMenuStudent(null);
    setStudentToEdit(student);
    setEditFirstName(student.firstName);
    setEditLastName(student.lastName);
    setEditError('');
  };

  const closeEditModal = () => {
    if (editSaving) return;
    setStudentToEdit(null);
    setEditFirstName('');
    setEditLastName('');
    setEditError('');
  };

  const submitEditStudent = async () => {
    if (!studentToEdit) return;
    setEditSaving(true);
    setEditError('');
    try {
      await updateStudent(studentToEdit, { firstName: editFirstName, lastName: editLastName });
      setStudentToEdit(null);
      setEditFirstName('');
      setEditLastName('');
    } catch {
      setEditError(t('cannotEditStudent') as string);
    } finally {
      setEditSaving(false);
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
      await addStudent({ classId: classRow.id, firstName: studentFirstName, lastName: studentLastName });
      setAddModalVisible(false);
      setStudentFirstName('');
      setStudentLastName('');
    } catch {
      setAddError(t('cannotAddStudent') as string);
    } finally {
      setSaving(false);
    }
  };

  const listHeader = (
    <>
      <WashiTape />
      <View style={styles.header}>
        <Title style={styles.title}>{classRow.name}</Title>
        <View style={styles.metaLine}>
          <Sparkle />
          <Text style={styles.meta}>{t('studentsAndRisk', { count: students.length, risk: atRisk })}</Text>
        </View>
      </View>
      <SegmentedControl
        value={sort}
        onChange={setSort}
        options={[
          { value: 'name', label: t('sortName') as string },
          { value: 'crosses', label: t('sortCroix') as string },
          { value: 'ticks', label: t('sortTicks') as string }
        ]}
        style={styles.segmented}
      />
    </>
  );

  return (
    <Screen>
      <FlatList
        testID="class-dashboard-list"
        data={students}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        initialNumToRender={10}
        getItemLayout={(_, index) => ({ length: 174, offset: 174 * index, index })}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={t('emptyStudentsTitle') as string}
            message={t('emptyStudentsMessage') as string}
            actionLabel={t('addStudent') as string}
            onAction={() => setAddModalVisible(true)}
          />
        }
        renderItem={({ item }) => (
          <StudentCard
            student={item}
            onPress={() => navigation.navigate('StudentDetail', { studentId: item.id })}
            onMenu={() => setMenuStudent(item)}
          />
        )}
      />
      <PillButton onPress={() => setAddModalVisible(true)} variant="pink" style={styles.add}>
        {t('addStudent')}
      </PillButton>
      <SheetModal visible={addModalVisible} onRequestClose={closeAddModal}>
        <Card style={styles.sheet} washi>
          <Text style={styles.modalTitle}>{t('addStudent')}</Text>
          <JournalInput
            placeholder={t('firstName') as string}
            value={studentFirstName}
            onChangeText={setStudentFirstName}
          />
          <JournalInput
            placeholder={t('lastName') as string}
            value={studentLastName}
            onChangeText={setStudentLastName}
          />
          {!!addError && <Text style={styles.error}>{addError}</Text>}
          <View style={styles.actions}>
            <PillButton
              testID="cancel-add-student"
              disabled={saving}
              onPress={closeAddModal}
              variant="light"
              style={styles.actionButton}
            >
              {t('cancel')}
            </PillButton>
            <PillButton
              disabled={saving}
              onPress={submitStudent}
              variant="pink"
              style={styles.actionButton}
            >
              {saving ? t('adding') : t('add')}
            </PillButton>
          </View>
        </Card>
      </SheetModal>
      <Modal
        visible={!!menuStudent}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuStudent(null)}
      >
        <View style={styles.backdrop}>
          <Card style={styles.dialog} washi>
            <Text style={styles.modalTitle}>
              {menuStudent?.firstName} {menuStudent?.lastName}
            </Text>
            <PillButton
              testID="menu-edit-student"
              onPress={() => menuStudent && openEditModal(menuStudent)}
              variant="light"
            >
              {t('edit')}
            </PillButton>
            <PillButton
              testID="menu-delete-student"
              onPress={() => {
                setStudentToDelete(menuStudent);
                setMenuStudent(null);
              }}
              variant="pink"
            >
              {t('delete')}
            </PillButton>
            <PillButton
              testID="menu-cancel"
              onPress={() => setMenuStudent(null)}
              variant="light"
            >
              {t('cancel')}
            </PillButton>
          </Card>
        </View>
      </Modal>
      <SheetModal visible={!!studentToEdit} onRequestClose={closeEditModal}>
        <Card style={styles.sheet} washi>
          <Text style={styles.modalTitle}>{t('editStudentTitle')}</Text>
          <JournalInput
            placeholder={t('firstName') as string}
            value={editFirstName}
            onChangeText={setEditFirstName}
          />
          <JournalInput
            placeholder={t('lastName') as string}
            value={editLastName}
            onChangeText={setEditLastName}
          />
          {!!editError && <Text style={styles.error}>{editError}</Text>}
          <View style={styles.actions}>
            <PillButton
              testID="cancel-edit-student"
              disabled={editSaving}
              onPress={closeEditModal}
              variant="light"
              style={styles.actionButton}
            >
              {t('cancel')}
            </PillButton>
            <PillButton
              testID="confirm-edit-student"
              disabled={editSaving}
              onPress={submitEditStudent}
              variant="pink"
              style={styles.actionButton}
            >
              {editSaving ? t('saving') : t('save')}
            </PillButton>
          </View>
        </Card>
      </SheetModal>
      <Modal
        visible={!!studentToDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setStudentToDelete(null)}
      >
        <View style={styles.backdrop}>
          <Card style={styles.dialog} washi>
            <Text style={styles.modalTitle}>{t('deleteStudentTitle')}</Text>
            <Text style={styles.modalStrong}>
              {studentToDelete?.firstName} {studentToDelete?.lastName}
            </Text>
            <Text style={styles.modalText}>{t('deleteStudentMessage')}</Text>
            <View style={styles.actions}>
              <PillButton
                testID="cancel-delete-student"
                disabled={deleting}
                onPress={() => setStudentToDelete(null)}
                variant="light"
                style={styles.actionButton}
              >
                {t('cancel')}
              </PillButton>
              <PillButton
                testID="confirm-delete-student"
                disabled={deleting}
                onPress={confirmDeleteStudent}
                variant="pink"
                style={styles.actionButton}
              >
                {deleting ? t('deleting') : t('delete')}
              </PillButton>
            </View>
          </Card>
        </View>
      </Modal>
      <BackButton floating navigation={navigation} fallbackRoute="ClassesHome" />
    </Screen>
  );
};

const styles = StyleSheet.create({
  listContent: { flexGrow: 1, paddingTop: 76, paddingBottom: 148, paddingHorizontal: 16 },
  header: { marginBottom: 14 },
  title: { marginBottom: 4 },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { fontFamily: 'PatrickHand_400Regular', color: colors.muted, fontSize: 19 },
  segmented: { marginBottom: 12 },
  add: { marginTop: 8, marginBottom: 84, marginHorizontal: 16 },
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
