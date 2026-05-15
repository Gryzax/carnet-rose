import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useT } from '../utils/i18n';
import { useReasons, type ReasonKind } from '../utils/reasons';
import { Card, JournalInput, PillButton, SegmentedControl } from './Themed';

// Settings editor for tick/cross reasons: hide unused defaults, add custom
// reasons, rename or delete the custom ones. Lives in its own component to
// keep SettingsScreen lean — it owns all the local editing state.
export const ReasonsEditor = () => {
  const { t } = useT();
  const { defaultReasons, customReasons, addCustom, removeCustom, renameCustom, toggleDefault } =
    useReasons();
  const [kind, setKind] = useState<ReasonKind>('tick');
  const [draft, setDraft] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  const defaults = defaultReasons(kind);
  const custom = customReasons(kind);

  const submitAdd = () => {
    addCustom(kind, draft);
    setDraft('');
  };

  const openRename = (reason: string) => {
    setRenaming(reason);
    setRenameText(reason);
  };

  const submitRename = () => {
    if (renaming) renameCustom(kind, renaming, renameText);
    setRenaming(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>{t('reasonsHint')}</Text>
      <SegmentedControl
        options={[
          { value: 'tick', label: t('reasonsTicksTab') as string },
          { value: 'cross', label: t('reasonsCrossesTab') as string },
        ]}
        value={kind}
        onChange={(next) => setKind(next)}
      />

      <Text style={styles.groupLabel}>{t('reasonsDefaults')}</Text>
      {defaults.map((reason) => (
        <View key={`d-${reason.index}`} style={styles.row}>
          <Text style={[styles.reasonText, reason.hidden && styles.reasonHidden]} numberOfLines={1}>
            {reason.label}
          </Text>
          <Pressable
            testID={`reason-toggle-${kind}-${reason.index}`}
            accessibilityRole="button"
            accessibilityLabel={
              t(reason.hidden ? 'reasonShow' : 'reasonHide', { reason: reason.label }) as string
            }
            hitSlop={8}
            onPress={() => toggleDefault(kind, reason.index)}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <Ionicons
              name={reason.hidden ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={reason.hidden ? colors.muted : colors.ink}
            />
          </Pressable>
        </View>
      ))}

      <Text style={styles.groupLabel}>{t('reasonsCustom')}</Text>
      {custom.length === 0 && <Text style={styles.empty}>{t('reasonsNoCustom')}</Text>}
      {custom.map((reason) => (
        <View key={`c-${reason}`} style={styles.row}>
          <Text style={styles.reasonText} numberOfLines={1}>
            {reason}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('reasonRename', { reason }) as string}
            hitSlop={8}
            onPress={() => openRename(reason)}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <Ionicons name="pencil-outline" size={19} color={colors.ink} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('reasonDelete', { reason }) as string}
            hitSlop={8}
            onPress={() => removeCustom(kind, reason)}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <Ionicons name="trash-outline" size={19} color={colors.dangerRed} />
          </Pressable>
        </View>
      ))}

      <View style={styles.addRow}>
        <JournalInput
          testID="reason-add-input"
          style={styles.addInput}
          value={draft}
          onChangeText={setDraft}
          placeholder={t('reasonAddPlaceholder') as string}
          returnKeyType="done"
          onSubmitEditing={submitAdd}
        />
        <PillButton
          testID="reason-add-button"
          onPress={submitAdd}
          variant="sage"
          disabled={!draft.trim()}
          style={styles.addButton}
        >
          {t('add')}
        </PillButton>
      </View>

      <Modal
        transparent
        visible={renaming !== null}
        animationType="fade"
        onRequestClose={() => setRenaming(null)}
      >
        <View style={styles.backdrop}>
          <Card style={styles.dialog} washi>
            <Text style={styles.dialogTitle}>{t('reasonRenameTitle')}</Text>
            <JournalInput
              testID="reason-rename-input"
              value={renameText}
              onChangeText={setRenameText}
              returnKeyType="done"
              onSubmitEditing={submitRename}
              autoFocus
            />
            <PillButton onPress={submitRename} variant="sage" disabled={!renameText.trim()}>
              {t('save')}
            </PillButton>
            <PillButton onPress={() => setRenaming(null)} variant="light">
              {t('cancel')}
            </PillButton>
          </Card>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 10 },
  hint: { color: colors.muted, fontFamily: 'PatrickHand_400Regular', fontSize: 19, lineHeight: 24 },
  groupLabel: {
    color: colors.muted,
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 16,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  reasonText: { flex: 1, color: colors.ink, fontFamily: 'PatrickHand_400Regular', fontSize: 20 },
  reasonHidden: { color: colors.muted, textDecorationLine: 'line-through' },
  empty: {
    color: colors.muted,
    fontFamily: 'PatrickHand_400Regular',
    fontSize: 18,
    fontStyle: 'italic',
  },
  iconBtn: { padding: 6, borderRadius: 999 },
  pressed: { transform: [{ scale: 0.94 }] },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  addInput: { flex: 1 },
  addButton: { paddingHorizontal: 18 },
  backdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.scrim },
  dialog: { gap: 12 },
  dialogTitle: { fontSize: 28, fontFamily: 'PatrickHand_400Regular', color: colors.ink },
});
