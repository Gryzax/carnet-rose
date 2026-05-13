import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { colors } from '../constants/colors';
import { Sparkle } from './Themed';

export const ReasonSheet = ({ visible, reasons, onSelect, onClose }) => {
  const y = useRef(new Animated.Value(220)).current;
  useEffect(() => {
    Animated.spring(y, { toValue: visible ? 0 : 220, friction: 9, tension: 90, useNativeDriver: true }).start();
  }, [visible, y]);
  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable testID="sheet-backdrop" style={styles.backdrop} onPress={onClose} />
      <Animated.View testID="reason-sheet" style={[styles.sheet, { transform: [{ translateY: y }] }]}>
        <View style={styles.washi} />
        <Text style={styles.title}>Choisir une raison</Text>
        {reasons.map((reason) => (
          <Pressable key={reason} style={({ pressed }) => [styles.item, pressed && styles.pressed]} onPress={() => onSelect(reason)}>
            <Sparkle />
            <Text style={styles.itemText}>{reason}</Text>
          </Pressable>
        ))}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim },
  sheet: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: colors.card, borderRadius: 20, borderColor: colors.border, borderWidth: 1.5, padding: 18 },
  washi: { position: 'absolute', top: -10, alignSelf: 'center', width: 88, height: 24, borderRadius: 3, backgroundColor: colors.orange, opacity: 0.84, transform: [{ rotate: '4deg' }] },
  title: { fontFamily: 'PatrickHand_400Regular', color: colors.ink, fontSize: 28, marginBottom: 8 },
  item: { minHeight: 48, paddingVertical: 10, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemText: { fontFamily: 'PatrickHand_400Regular', fontSize: 20, color: colors.ink, flex: 1 },
  pressed: { transform: [{ scale: 0.98 }] }
});
