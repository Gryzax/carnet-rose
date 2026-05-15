import type { ReactNode } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../constants/colors';
import { Card, PillButton, type PillButtonVariant } from './Themed';

// Shared modal shell: a centered white notebook card with washi tape over a
// scrim. Bespoke dialogs (text inputs, stacked menu buttons) render their own
// body inside it; the common cancel/confirm flow uses ConfirmDialog below.
export const DialogModal = ({
  visible,
  onRequestClose,
  children,
}: {
  visible: boolean;
  onRequestClose: () => void;
  children: ReactNode;
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
    <View style={styles.backdrop}>
      <Card style={styles.dialog} washi>
        {children}
      </Card>
    </View>
  </Modal>
);

export const DialogTitle = ({ children }: { children: ReactNode }) => (
  <Text style={styles.title}>{children}</Text>
);

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  // Optional larger emphasis line, e.g. the name of the entity being deleted.
  emphasis?: string;
  message?: string;
  error?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  // Disables both buttons while an async action is in flight.
  busy?: boolean;
  confirmVariant?: PillButtonVariant;
  confirmTestID?: string;
  cancelTestID?: string;
}

// The cancel/confirm dialog shared by every destructive confirmation flow.
export const ConfirmDialog = ({
  visible,
  title,
  emphasis,
  message,
  error,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  busy = false,
  confirmVariant = 'pink',
  confirmTestID,
  cancelTestID,
}: ConfirmDialogProps) => (
  <DialogModal visible={visible} onRequestClose={onCancel}>
    <DialogTitle>{title}</DialogTitle>
    {!!emphasis && <Text style={styles.emphasis}>{emphasis}</Text>}
    {!!message && <Text style={styles.message}>{message}</Text>}
    {!!error && <Text style={styles.error}>{error}</Text>}
    <View style={styles.actions}>
      <PillButton
        testID={cancelTestID}
        disabled={busy}
        onPress={onCancel}
        variant="light"
        style={styles.actionButton}
      >
        {cancelLabel}
      </PillButton>
      <PillButton
        testID={confirmTestID}
        disabled={busy}
        onPress={onConfirm}
        variant={confirmVariant}
        style={styles.actionButton}
      >
        {confirmLabel}
      </PillButton>
    </View>
  </DialogModal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialog: { gap: spacing.sm + 4 },
  title: { fontFamily: typography.regular, fontSize: 28, color: colors.ink },
  emphasis: { fontFamily: typography.regular, fontSize: 22, color: colors.ink },
  message: {
    fontFamily: typography.regular,
    fontSize: 19,
    color: colors.muted,
    lineHeight: 24,
  },
  error: { fontFamily: typography.regular, fontSize: 18, color: colors.dangerRed },
  actions: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1 },
});
