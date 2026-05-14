import { fireEvent, render } from '@testing-library/react-native';
import { ReasonSheet } from '../../components/ReasonSheet';
import { UndoSnackbar } from '../../components/UndoSnackbar';
import { EmptyState } from '../../components/EmptyState';

test('ouverture et fermeture des modales', () => {
  const onClose = jest.fn();
  const { getByText, getByTestId } = render(<ReasonSheet visible reasons={['Participation']} onSelect={jest.fn()} onClose={onClose} />);
  expect(getByText('Choose a reason')).toBeTruthy();
  expect(getByTestId('reason-sheet-scroll')).toBeTruthy();
  fireEvent.press(getByTestId('sheet-backdrop'));
  expect(onClose).toHaveBeenCalled();
});

test('snackbar Undo', () => {
  const onUndo = jest.fn();
  const { getByText, queryByTestId, rerender } = render(<UndoSnackbar visible onUndo={onUndo} />);
  expect(queryByTestId('undo-snackbar')).toBeTruthy();
  fireEvent.press(getByText('Undo'));
  expect(onUndo).toHaveBeenCalled();
  rerender(<UndoSnackbar visible={false} onUndo={onUndo} />);
  expect(queryByTestId('undo-snackbar')).toBeNull();
});

test('EmptyState affiche action optionnelle', () => {
  const onAction = jest.fn();
  const { getByText, getByTestId } = render(<EmptyState title="Aucune classe" message="Creez une classe" actionLabel="Ajouter" onAction={onAction} />);
  expect(getByTestId('empty-state')).toBeTruthy();
  fireEvent.press(getByText('Ajouter'));
  expect(onAction).toHaveBeenCalled();
});
