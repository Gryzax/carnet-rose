import { Animated, StyleSheet, Text } from 'react-native';
import { useEffect, useRef } from 'react';
import { colors } from '../constants/colors';
import { PillButton } from './Themed';

export const UndoSnackbar = ({ visible, onUndo, message = 'Action enregistree' }) => {
  const y = useRef(new Animated.Value(90)).current;
  useEffect(() => {
    Animated.spring(y, { toValue: visible ? 0 : 90, friction: 9, tension: 90, useNativeDriver: true }).start();
  }, [visible, y]);
  if (!visible) return null;
  return (
    <Animated.View testID="undo-snackbar" style={[styles.snack, { transform: [{ translateY: y }] }]}>
      <Text style={styles.text}>{message}</Text>
      <PillButton onPress={onUndo} variant="pink" style={styles.undo}>Annuler</PillButton>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  snack: { position: 'absolute', left: 16, right: 16, bottom: 18, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1.5, borderRadius: 20, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  text: { color: colors.ink, fontFamily: 'PatrickHand_400Regular', flex: 1, fontSize: 18 },
  undo: { minHeight: 40, paddingVertical: 6 }
});
