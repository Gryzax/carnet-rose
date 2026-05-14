import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

export interface SheetModalProps {
  visible: boolean;
  onRequestClose?: () => void;
  onShow?: () => void;
  onBackdropPress?: () => void;
  children: ReactNode;
}

// Bottom sheet that fades the backdrop in while sliding/fading the content up.
export const SheetModal = ({
  visible,
  onRequestClose,
  onShow,
  onBackdropPress,
  children
}: SheetModalProps) => {
  const slide = useRef(new Animated.Value(24)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    slide.setValue(24);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true })
    ]).start();
  }, [opacity, slide, visible]);

  const content = (
    <Animated.View style={{ opacity, transform: [{ translateY: slide }] }}>{children}</Animated.View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose} onShow={onShow}>
      {onBackdropPress ? (
        <Pressable onPress={onBackdropPress} style={styles.backdrop}>
          {content}
        </Pressable>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.backdrop}
        >
          {content}
        </KeyboardAvoidingView>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end', padding: 12, paddingBottom: 24 }
});
