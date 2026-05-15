import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { colors, typography } from '../constants/colors';
import { CardTape, Sparkle } from './Themed';
import { useT } from '../utils/i18n';
import { USE_NATIVE_DRIVER } from '../utils/animation';

export interface ReasonSheetProps {
  visible: boolean;
  reasons: string[];
  onSelect: (reason: string) => void;
  onClose: () => void;
}

export const ReasonSheet = ({ visible, reasons, onSelect, onClose }: ReasonSheetProps) => {
  const { t } = useT();
  const y = useRef(new Animated.Value(220)).current;
  useEffect(() => {
    Animated.spring(y, {
      toValue: visible ? 0 : 220,
      friction: 9,
      tension: 90,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [visible, y]);
  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable
        testID="sheet-backdrop"
        accessibilityRole="button"
        accessibilityLabel={t('close') as string}
        style={styles.backdrop}
        onPress={onClose}
      />
      <Animated.View
        testID="reason-sheet"
        style={[styles.sheet, { transform: [{ translateY: y }] }]}
      >
        <CardTape />
        <Text accessibilityRole="header" style={styles.title}>
          {t('chooseReason')}
        </Text>
        <ScrollView
          testID="reason-sheet-scroll"
          style={styles.reasonList}
          keyboardShouldPersistTaps="handled"
        >
          {reasons.map((reason) => (
            <Pressable
              key={reason}
              accessibilityRole="button"
              accessibilityLabel={reason}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
              onPress={() => onSelect(reason)}
            >
              <Sparkle />
              <Text style={styles.itemText}>{reason}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 24,
    maxHeight: '88%',
    backgroundColor: colors.card,
    borderRadius: 20,
    borderColor: colors.border,
    borderWidth: 1.5,
    padding: 18,
  },
  reasonList: { maxHeight: 420 },
  title: { fontFamily: typography.regular, color: colors.ink, fontSize: 28, marginBottom: 8 },
  item: {
    minHeight: 48,
    paddingVertical: 10,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemText: { fontFamily: typography.regular, fontSize: 20, color: colors.ink, flex: 1 },
  pressed: { transform: [{ scale: 0.97 }] },
});
