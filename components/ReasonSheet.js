import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { colors } from '../constants/colors';

export const ReasonSheet = ({ visible, reasons, onSelect, onClose }) => {
  const y = useRef(new Animated.Value(220)).current;
  useEffect(() => {
    Animated.timing(y, { toValue: visible ? 0 : 220, duration: 220, useNativeDriver: true }).start();
  }, [visible, y]);
  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableOpacity testID="sheet-backdrop" style={styles.backdrop} onPress={onClose} />
      <Animated.View testID="reason-sheet" style={[styles.sheet, { transform: [{ translateY: y }] }]}>
        <Text style={styles.title}>Choisir une raison</Text>
        {reasons.map((reason) => <TouchableOpacity key={reason} style={styles.item} onPress={() => onSelect(reason)}><Text style={styles.itemText}>{reason}</Text></TouchableOpacity>)}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18 },
  title: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, marginBottom: 8 },
  item: { paddingVertical: 14, borderBottomColor: colors.lightPink, borderBottomWidth: 1 },
  itemText: { fontFamily: 'NunitoSans_600SemiBold', fontSize: 16, color: colors.textDark }
});
