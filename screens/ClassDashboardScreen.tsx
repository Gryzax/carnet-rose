import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../constants/colors';
import { BackButton } from '../components/BackButton';
import { EmptyState } from '../components/EmptyState';
import { SheetModal } from '../components/SheetModal';
import { StudentCard } from '../components/StudentCard';
import { ConfirmDialog, DialogModal, DialogTitle } from '../components/ConfirmDialog';
import {
  Card,
  JournalInput,
  PillButton,
  Screen,
  SegmentedControl,
  Sparkle,
  Title,
  WashiTape,
} from '../components/Themed';
import { useStudents, type StudentSort } from '../hooks/useStudents';
import { useStudentMutations } from '../hooks/useStudentMutations';
import { useClassMutations } from '../hooks/useClassMutations';
import { useT } from '../utils/i18n';
import type { ClassesStackParamList } from '../navigation/types';
import type { StudentRow } from '../types/domain';

type Props = NativeStackScreenProps<ClassesStackParamList, 'ClassDashboard'>;

export const ClassDashboardScreen = ({ route, navigation }: Props) => {
  const { t } = useT();
  const { classRow } = route.params;
  const [sort, setSort] = useState<StudentSort>('name');
  const [query, setQuery] = useState('');
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
  const { create, edit, remove } = useStudentMutations();
  const { markUsed } = useClassMutations();
  const atRisk = useMemo(() => students.filter((s) => s.crosses >= 2).length, [students]);
  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        `${s.lastName} ${s.firstName}`.toLowerCase().includes(q),
    );
  }, [students, query]);

  useEffect(() => {
    markUsed.mutate(classRow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classRow]);

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    setDeleting(true);
    try {
      await remove.mutateAsync(studentToDelete);
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
      await edit.mutateAsync({
        student: studentToEdit,
        changes: { firstName: editFirstName, lastName: editLastName },
      });
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
      await create.mutateAsync({
        classId: classRow.id,
        firstName: studentFirstName,
        lastName: studentLastName,
      });
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
          <Text style={styles.meta}>
            {t('studentsAndRisk', { count: students.length, risk: atRisk })}
          </Text>
        </View>
      </View>
      <SegmentedControl
        value={sort}
        onChange={setSort}
        options={[
          { value: 'name', label: t('sortName') as string },
          { value: 'crosses', label: t('sortCroix') as string },
          { value: 'ticks', label: t('sortTicks') as string },
        ]}
        style={styles.segmented}
      />
      {students.length > 0 && (
        <JournalInput
          testID="student-search"
          clearable
          placeholder={t('searchStudents') as string}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.search}
        />
      )}
    </>
  );

  return (
    <Screen>
      <FlatList
        testID="class-dashboard-list"
        data={filteredStudents}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        initialNumToRender={10}
        getItemLayout={(_, index) => ({ length: 174, offset: 174 * index, index })}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          query.trim() ? (
            <EmptyState icon="search-outline" title={t('noStudentsMatch') as string} />
          ) : (
            <EmptyState
              icon="people-outline"
              title={t('emptyStudentsTitle') as string}
              message={t('emptyStudentsMessage') as string}
              actionLabel={t('addStudent') as string}
              onAction={() => setAddModalVisible(true)}
            />
          )
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
      <SheetModal
        visible={addModalVisible}
        onRequestClose={closeAddModal}
        onBackdropPress={closeAddModal}
      >
        <Pressable>
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
        </Pressable>
      </SheetModal>
      <DialogModal visible={!!menuStudent} onRequestClose={() => setMenuStudent(null)}>
        <DialogTitle>
          {menuStudent?.firstName} {menuStudent?.lastName}
        </DialogTitle>
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
        <PillButton testID="menu-cancel" onPress={() => setMenuStudent(null)} variant="light">
          {t('cancel')}
        </PillButton>
      </DialogModal>
      <SheetModal
        visible={!!studentToEdit}
        onRequestClose={closeEditModal}
        onBackdropPress={closeEditModal}
      >
        <Pressable>
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
        </Pressable>
      </SheetModal>
      <ConfirmDialog
        visible={!!studentToDelete}
        title={t('deleteStudentTitle') as string}
        emphasis={
          studentToDelete ? `${studentToDelete.firstName} ${studentToDelete.lastName}` : undefined
        }
        message={t('deleteStudentMessage') as string}
        cancelLabel={t('cancel') as string}
        confirmLabel={(deleting ? t('deleting') : t('delete')) as string}
        onCancel={() => setStudentToDelete(null)}
        onConfirm={confirmDeleteStudent}
        busy={deleting}
        cancelTestID="cancel-delete-student"
        confirmTestID="confirm-delete-student"
      />
      <BackButton floating navigation={navigation} fallbackRoute="ClassesHome" />
    </Screen>
  );
};

const styles = StyleSheet.create({
  listContent: { flexGrow: 1, paddingTop: 76, paddingBottom: 96, paddingHorizontal: 16 },
  header: { marginBottom: 14 },
  title: { marginBottom: 4 },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { fontFamily: typography.regular, color: colors.muted, fontSize: 19 },
  segmented: { marginBottom: 12 },
  search: { marginBottom: 12 },
  add: { marginTop: 8, marginBottom: 84, marginHorizontal: 16 },
  sheet: { gap: 16, padding: spacing.lg },
  modalTitle: {
    fontFamily: typography.regular,
    fontSize: 28,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  error: { fontFamily: typography.regular, fontSize: 18, color: colors.dangerRed },
  actions: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1 },
});
