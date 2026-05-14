import { Ionicons } from '@expo/vector-icons';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type ListRenderItem,
  type ListRenderItemInfo
} from 'react-native';
import { useMemo, useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import { useT } from '../utils/i18n';
import { addClass, markClassUsed, updateClass, deleteClass } from '../controllers/classController';
import { useClasses } from '../hooks/useClasses';
import { useAllStudents } from '../hooks/useStudents';
import { EmptyState } from '../components/EmptyState';
import { SheetModal } from '../components/SheetModal';
import { ProgressBar } from '../components/ProgressBar';
import { StudentAvatar } from '../components/StudentAvatar';
import { CROSSES_FOR_DETENTION, TICKS_FOR_MERIT } from '../constants/config';
import {
  Card,
  IconButton,
  JournalInput,
  Pill,
  PillButton,
  Screen,
  SegmentedControl,
  Sparkle,
  Title,
  WashiTape
} from '../components/Themed';
import type { ClassesStackParamList } from '../navigation/types';
import type { ClassSort } from '../controllers/classController';
import type { ClassWithStats, StudentWithClass } from '../types/domain';

type Props = NativeStackScreenProps<ClassesStackParamList, 'ClassesHome'>;

export const ClassesScreen = ({ navigation }: Props) => {
  const { t } = useT();
  const [sort, setSort] = useState<ClassSort>('alpha');
  const [query, setQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [className, setClassName] = useState('');
  const [addError, setAddError] = useState('');
  const [classToDelete, setClassToDelete] = useState<ClassWithStats | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuClass, setMenuClass] = useState<ClassWithStats | null>(null);
  const [classToEdit, setClassToEdit] = useState<ClassWithStats | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const { width } = useWindowDimensions();
  const { classes } = useClasses(sort);
  const { students: allStudents } = useAllStudents();
  const searching = query.trim().length >= 2;
  const columns = searching ? 1 : width >= 768 ? 2 : 1;
  const results = useMemo<StudentWithClass[]>(() => {
    const text = query.trim().toLowerCase();
    if (text.length < 2) return [];
    return allStudents.filter((s) =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(text)
    );
  }, [query, allStudents]);
  const data = useMemo<(ClassWithStats | StudentWithClass)[]>(
    () => (searching ? results : classes),
    [searching, results, classes]
  );

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
      setAddError(t('classNameRequired') as string);
      return;
    }
    setSaving(true);
    setAddError('');
    try {
      await addClass(normalizedName);
      setAddModalVisible(false);
      setClassName('');
    } catch {
      setAddError(t('cannotAddClass') as string);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (classRow: ClassWithStats) => {
    setMenuClass(null);
    setClassToEdit(classRow);
    setEditName(classRow.name);
    setEditError('');
  };

  const closeEditModal = () => {
    if (editSaving) return;
    setClassToEdit(null);
    setEditName('');
    setEditError('');
  };

  const submitEditClass = async () => {
    if (!classToEdit) return;
    const normalizedName = editName.trim();
    if (!normalizedName) {
      setEditError(t('classNameRequired') as string);
      return;
    }
    setEditSaving(true);
    setEditError('');
    try {
      await updateClass(classToEdit, normalizedName);
      setClassToEdit(null);
      setEditName('');
    } catch {
      setEditError(t('cannotEditClass') as string);
    } finally {
      setEditSaving(false);
    }
  };

  const openDeleteModal = (classRow: ClassWithStats) => {
    setMenuClass(null);
    setClassToDelete(classRow);
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
      await deleteClass(classToDelete);
      setClassToDelete(null);
    } catch {
      setDeleteError(t('cannotDeleteClass') as string);
    } finally {
      setDeleting(false);
    }
  };

  const openClass = async (classRow: ClassWithStats) => {
    await markClassUsed(classRow);
    navigation.navigate('ClassDashboard', { classRow });
  };

  const renderResult = ({ item }: ListRenderItemInfo<StudentWithClass>) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.firstName} ${item.lastName}`}
      onPress={() => navigation.navigate('StudentDetail', { studentId: item.id })}
      style={({ pressed }) => [styles.resultWrap, pressed && styles.pressed]}
    >
      <Card washi style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <StudentAvatar student={item} />
          <View style={styles.resultNameBlock}>
            <Text accessibilityRole="header" style={styles.resultName}>
              {item.lastName.toUpperCase()} {item.firstName}
            </Text>
            <View style={styles.line}>
              <Sparkle />
              <Text style={styles.meta}>{item.className}</Text>
            </View>
          </View>
        </View>
        <View style={styles.resultRow}>
          <Pill style={styles.resultMetric}>{t('ticksLabel')}</Pill>
          <Text style={styles.resultCount}>
            {item.ticks}/{TICKS_FOR_MERIT}
          </Text>
          <ProgressBar value={item.ticks} max={TICKS_FOR_MERIT} color={colors.successGreen} />
        </View>
        <View style={styles.resultRow}>
          <Pill style={styles.resultMetric}>{t('crossesLabel')}</Pill>
          <Text style={styles.resultCount}>
            {item.crosses}/{CROSSES_FOR_DETENTION}
          </Text>
          <ProgressBar value={item.crosses} max={CROSSES_FOR_DETENTION} color={colors.dangerRed} />
        </View>
        <View style={styles.stats}>
          <Pill tone="pink">{t('meritsPill', { count: item.merits })}</Pill>
          <Pill>{t('detentionsPill', { count: item.detentions })}</Pill>
        </View>
      </Card>
    </Pressable>
  );

  const renderClass = ({ item }: ListRenderItemInfo<ClassWithStats>) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.name}
      onPress={() => openClass(item)}
      style={({ pressed }) => [styles.classWrap, pressed && styles.pressed]}
    >
      <Card washi style={styles.classCard}>
        <View style={styles.classHeader}>
          <Text accessibilityRole="header" style={styles.classTitle}>
            {item.name}
          </Text>
          <IconButton
            icon="ellipsis-horizontal"
            testID={`class-menu-${item.id}`}
            accessibilityLabel={t('classOptions', { name: item.name }) as string}
            onPress={() => setMenuClass(item)}
          />
        </View>
        <View style={styles.line}>
          <Sparkle />
          <Text style={styles.meta}>{t('studentsCountShort', { count: item.studentCount })}</Text>
        </View>
        <View style={styles.stats}>
          <Pill tone="pink">{t('meritsPill', { count: item.totalMerits })}</Pill>
          <Pill>{t('detentionsPill', { count: item.totalDetentions })}</Pill>
        </View>
      </Card>
    </Pressable>
  );

  const listHeader = (
    <>
      <WashiTape />
      <Title>{t('classesTitle')}</Title>
      <JournalInput
        placeholder={t('searchStudent') as string}
        value={query}
        onChangeText={setQuery}
        clearable
        style={styles.search}
      />
      {!searching && (
        <SegmentedControl
          value={sort}
          onChange={setSort}
          options={[
            { value: 'alpha', label: t('sortAlpha') as string },
            { value: 'recent', label: t('sortRecent') as string }
          ]}
          style={styles.segmented}
        />
      )}
    </>
  );

  return (
    <Screen>
      <FlatList
        testID="classes-list"
        key={columns}
        data={data}
        numColumns={columns}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        initialNumToRender={8}
        getItemLayout={
          searching ? undefined : (_, index) => ({ length: 142, offset: 142 * index, index })
        }
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          searching ? (
            <EmptyState
              icon="search-outline"
              title={t('noSearchResultsTitle') as string}
              message={t('noSearchResultsMessage') as string}
            />
          ) : (
            <EmptyState
              icon="basket-outline"
              title={t('emptyClassesTitle') as string}
              message={t('emptyClassesMessage') as string}
              actionLabel={t('addClass') as string}
              onAction={openAddModal}
            />
          )
        }
        renderItem={
          // Heterogeneous list: search shows students, otherwise classes.
          (searching ? renderResult : renderClass) as unknown as ListRenderItem<
            ClassWithStats | StudentWithClass
          >
        }
      />
      {!searching && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('addClass') as string}
          testID="add-class-fab"
          onPress={openAddModal}
          style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
        >
          <Ionicons name="add-outline" color={colors.onPrimary} size={32} />
        </Pressable>
      )}
      <EditClassModal
        visible={addModalVisible}
        title={t('addClass') as string}
        value={className}
        error={addError}
        saving={saving}
        onChange={(text) => {
          setClassName(text);
          if (addError) setAddError('');
        }}
        onClose={closeAddModal}
        onSubmit={submitClass}
      />
      <EditClassModal
        visible={!!classToEdit}
        title={t('editClassTitle') as string}
        value={editName}
        error={editError}
        saving={editSaving}
        submitLabel={t('save') as string}
        savingLabel={t('saving') as string}
        onChange={(text) => {
          setEditName(text);
          if (editError) setEditError('');
        }}
        onClose={closeEditModal}
        onSubmit={submitEditClass}
      />
      <Modal
        visible={!!menuClass}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuClass(null)}
      >
        <View style={styles.backdrop}>
          <Card style={styles.dialog} washi>
            <Text style={styles.modalTitle}>{menuClass?.name}</Text>
            <PillButton
              testID="menu-edit-class"
              onPress={() => menuClass && openEditModal(menuClass)}
              variant="light"
            >
              {t('edit')}
            </PillButton>
            <PillButton
              testID="menu-delete-class"
              onPress={() => menuClass && openDeleteModal(menuClass)}
              variant="pink"
            >
              {t('delete')}
            </PillButton>
            <PillButton
              testID="menu-cancel-class"
              onPress={() => setMenuClass(null)}
              variant="light"
            >
              {t('cancel')}
            </PillButton>
          </Card>
        </View>
      </Modal>
      <Modal
        visible={!!classToDelete}
        transparent
        animationType="fade"
        onRequestClose={closeDeleteModal}
      >
        <View style={styles.backdrop}>
          <Card style={styles.dialog} washi>
            <Text style={styles.modalTitle}>{t('deleteClassTitle')}</Text>
            <Text style={styles.modalStrong}>{classToDelete?.name}</Text>
            <Text style={styles.modalText}>{t('deleteClassMessage')}</Text>
            {!!deleteError && <Text style={styles.error}>{deleteError}</Text>}
            <View style={styles.actions}>
              <PillButton
                testID="cancel-delete-class"
                disabled={deleting}
                onPress={closeDeleteModal}
                variant="light"
                style={styles.actionButton}
              >
                {t('cancel')}
              </PillButton>
              <PillButton
                testID="confirm-delete-class"
                disabled={deleting}
                onPress={confirmDeleteClass}
                variant="pink"
                style={styles.actionButton}
              >
                {deleting ? t('deleting') : t('delete')}
              </PillButton>
            </View>
          </Card>
        </View>
      </Modal>
    </Screen>
  );
};

interface EditClassModalProps {
  visible: boolean;
  title: string;
  value: string;
  error: string;
  saving: boolean;
  onChange: (text: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  savingLabel?: string;
}

const EditClassModal = ({
  visible,
  title,
  value,
  error,
  saving,
  onChange,
  onClose,
  onSubmit,
  submitLabel,
  savingLabel
}: EditClassModalProps) => {
  const { t } = useT();
  const inputRef = useRef<TextInput>(null);

  return (
    <SheetModal
      visible={visible}
      onRequestClose={onClose}
      onShow={() => setTimeout(() => inputRef.current?.focus?.(), 80)}
    >
      <Card style={styles.sheet} washi>
        <Text style={styles.modalTitle}>{title}</Text>
        <JournalInput
          ref={inputRef}
          placeholder={t('classNamePlaceholder') as string}
          value={value}
          onChangeText={onChange}
          testID="add-class-name-input"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.actions}>
          <PillButton disabled={saving} onPress={onClose} variant="light" style={styles.actionButton}>
            {t('cancel')}
          </PillButton>
          <PillButton disabled={saving} onPress={onSubmit} variant="pink" style={styles.actionButton}>
            {saving ? (savingLabel ?? t('adding')) : (submitLabel ?? t('add'))}
          </PillButton>
        </View>
      </Card>
    </SheetModal>
  );
};

const styles = StyleSheet.create({
  listContent: { flexGrow: 1, paddingTop: 16, paddingBottom: 148, paddingHorizontal: 16 },
  search: { marginBottom: 12 },
  segmented: { marginBottom: 12 },
  classWrap: { flex: 1 },
  classCard: { margin: 6, minHeight: 128 },
  classHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  classTitle: { flex: 1, fontFamily: 'PatrickHand_400Regular', fontSize: 28, color: colors.ink, lineHeight: 32 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  meta: { fontFamily: 'PatrickHand_400Regular', color: colors.muted, fontSize: 18 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  resultWrap: { flex: 1 },
  resultCard: { margin: 6, gap: 4 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  resultNameBlock: { flex: 1, gap: 2 },
  resultName: { fontFamily: 'PatrickHand_400Regular', fontSize: 24, color: colors.ink, lineHeight: 28 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  resultMetric: { width: 70, textAlign: 'center' },
  resultCount: { fontFamily: 'PatrickHand_400Regular', color: colors.ink, fontSize: 18, width: 40 },
  fab: { position: 'absolute', right: 20, bottom: 92, backgroundColor: colors.pink, borderColor: colors.border, borderWidth: 1.5, width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  pressed: { transform: [{ scale: 0.97 }] },
  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'center', padding: 20 },
  sheet: { marginBottom: 0 },
  dialog: { gap: 12 },
  modalTitle: { fontFamily: 'PatrickHand_400Regular', fontSize: 28, color: colors.ink },
  modalStrong: { fontFamily: 'PatrickHand_400Regular', fontSize: 22, color: colors.ink },
  modalText: { fontFamily: 'PatrickHand_400Regular', fontSize: 19, color: colors.muted, lineHeight: 24 },
  error: { fontFamily: 'PatrickHand_400Regular', fontSize: 18, color: colors.dangerRed },
  actions: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1 }
});
