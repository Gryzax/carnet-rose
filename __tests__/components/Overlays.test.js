import { fireEvent, render } from '@testing-library/react-native';
import { ReasonSheet } from '../../components/ReasonSheet';
import { UndoSnackbar } from '../../components/UndoSnackbar';

test('ouverture et fermeture des modales', () => {
  const onClose = jest.fn();
  const { getByText, getByTestId } = render(<ReasonSheet visible reasons={['Participation']} onSelect={jest.fn()} onClose={onClose} />);
  expect(getByText('Choisir une raison')).toBeTruthy();
  fireEvent.press(getByTestId('sheet-backdrop'));
  expect(onClose).toHaveBeenCalled();
});

test('snackbar Undo', () => {
  const onUndo = jest.fn();
  const { getByText, queryByTestId, rerender } = render(<UndoSnackbar visible onUndo={onUndo} />);
  expect(queryByTestId('undo-snackbar')).toBeTruthy();
  fireEvent.press(getByText('Annuler'));
  expect(onUndo).toHaveBeenCalled();
  rerender(<UndoSnackbar visible={false} onUndo={onUndo} />);
  expect(queryByTestId('undo-snackbar')).toBeNull();
});
