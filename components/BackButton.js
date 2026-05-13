import { IconButton } from './Themed';

export const BackButton = ({ navigation, fallbackRoute = 'Classes', style, label = 'Retour' }) => {
  const handlePress = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    navigation?.navigate?.(fallbackRoute);
  };

  return <IconButton icon="chevron-back-outline" label={label} onPress={handlePress} style={[{ alignSelf: 'flex-start', marginBottom: 12 }, style]} testID="back-button" />;
};
