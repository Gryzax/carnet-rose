import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
} from 'react-native';
import { colors } from '../constants/colors';
import { USE_NATIVE_DRIVER } from '../utils/animation';

export interface SheetModalProps {
  visible: boolean;
  onRequestClose?: () => void;
  onShow?: () => void;
  onBackdropPress?: () => void;
  // Accessible label for the tap-to-dismiss backdrop (only used when
  // `onBackdropPress` is set). Defaults to "Close".
  backdropLabel?: string;
  children: ReactNode;
}

// Bottom sheet that fades the backdrop in while sliding/fading the content up.
export const SheetModal = ({
  visible,
  onRequestClose,
  onShow,
  onBackdropPress,
  backdropLabel = 'Close',
  children,
}: SheetModalProps) => {
  const slide = useRef(new Animated.Value(24)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    slide.setValue(24);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
  }, [opacity, slide, visible]);

  const content = (
    <Animated.View accessibilityViewIsModal style={{ opacity, transform: [{ translateY: slide }] }}>
      {children}
    </Animated.View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
      onShow={onShow}
    >
      {onBackdropPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={backdropLabel}
          onPress={onBackdropPress}
          style={styles.backdrop}
        >
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
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
    padding: 12,
    paddingBottom: 24,
  },
});
