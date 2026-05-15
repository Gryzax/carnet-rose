import type { StyleProp, ViewStyle } from 'react-native';
import { IconButton } from './Themed';
import { useT } from '../utils/i18n';

export interface BackButtonNavigation {
  canGoBack?: () => boolean;
  goBack?: () => void;
  // Loosely typed: real react-navigation `navigate` has a route-specific
  // overloaded signature that does not narrow to a plain string param.
  navigate?: (...args: any[]) => void;
}

export interface BackButtonProps {
  navigation?: BackButtonNavigation;
  fallbackRoute?: string;
  style?: StyleProp<ViewStyle>;
  label?: string;
  /**
   * Pins the button to the top-left as an overlay so page content scrolls
   * behind it instead of being pushed down by a static header band.
   */
  floating?: boolean;
}

// Sits alongside the washi tape (Screen renders that at top: 14) so the two
// read as one fixed top strip with no opaque background behind them.
const floatingStyle: ViewStyle = {
  position: 'absolute',
  top: 14,
  left: 16,
  zIndex: 10,
  elevation: 10,
  marginBottom: 0,
};

export const BackButton = ({
  navigation,
  fallbackRoute = 'Classes',
  style,
  label,
  floating = false,
}: BackButtonProps) => {
  const { t } = useT();
  const resolvedLabel = label ?? (t('back') as string);
  const handlePress = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack?.();
      return;
    }
    navigation?.navigate?.(fallbackRoute);
  };

  return (
    <IconButton
      icon="chevron-back-outline"
      label={resolvedLabel}
      onPress={handlePress}
      style={[{ alignSelf: 'flex-start', marginBottom: 12 }, floating && floatingStyle, style]}
      testID="back-button"
    />
  );
};
