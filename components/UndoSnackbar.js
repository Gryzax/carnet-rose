import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useEffect, useRef } from 'react';
import { colors } from '../constants/colors';

export const UndoSnackbar = ({ visible, onUndo }) => {
  const y = useRef(new Animated.Value(90)).current;
  useEffect(() => {
    Animated.timing(y, { toValue: visible ? 0 : 90, duration: 220, useNativeDriver: true }).start();
  }, [visible, y]);
  if (!visible) return null;
  return (
    <Animated.View testID="undo-snackbar" style={[styles.snack, { transform: [{ translateY: y }] }]}>
      <Text style={styles.text}>Action enregistrée</Text>
      <TouchableOpacity onPress={onUndo}><Text style={styles.undo}>Annuler</Text></TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  snack: { position: 'absolute', left: 16, right: 16, bottom: 18, backgroundColor: colors.textDark, borderRadius: 20, padding: 14, flexDirection: 'row', justifyContent: 'space-between' },
  text: { color: colors.white, fontFamily: 'NunitoSans_600SemiBold' },
  undo: { color: colors.primaryPink, fontFamily: 'NunitoSans_800ExtraBold' }
});
