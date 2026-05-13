import { fireEvent, render } from '@testing-library/react-native';
import { BackButton } from '../../components/BackButton';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

test('BackButton appelle goBack quand un historique existe', () => {
  const navigation = { canGoBack: jest.fn(() => true), goBack: jest.fn(), navigate: jest.fn() };
  const { getByTestId } = render(<BackButton navigation={navigation} fallbackRoute="Classes" />);

  fireEvent.press(getByTestId('back-button'));

  expect(navigation.goBack).toHaveBeenCalled();
  expect(navigation.navigate).not.toHaveBeenCalled();
});

test("BackButton revient à l'accueil sans historique", () => {
  const navigation = { canGoBack: jest.fn(() => false), goBack: jest.fn(), navigate: jest.fn() };
  const { getByTestId } = render(<BackButton navigation={navigation} fallbackRoute="Classes" />);

  fireEvent.press(getByTestId('back-button'));

  expect(navigation.goBack).not.toHaveBeenCalled();
  expect(navigation.navigate).toHaveBeenCalledWith('Classes');
});
