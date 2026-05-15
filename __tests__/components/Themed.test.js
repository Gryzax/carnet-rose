import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { PillButton, Screen, Title } from '../../components/Themed';

test('Screen, Title et PillButton se rendent', () => {
  const { getByText } = render(
    <Screen>
      <Title>Titre</Title>
      <PillButton variant="light">
        <Text>Bouton</Text>
      </PillButton>
    </Screen>,
  );
  expect(getByText('Titre')).toBeTruthy();
  expect(getByText('Bouton')).toBeTruthy();
});
