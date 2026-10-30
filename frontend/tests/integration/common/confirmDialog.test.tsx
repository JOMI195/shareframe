import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from '@/common/components/confirmDialog';

const renderDialog = (props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog open title="Foto löschen?" confirmLabel="Löschen" onConfirm={onConfirm} onCancel={onCancel} {...props}>
      Das kann nicht rückgängig gemacht werden.
    </ConfirmDialog>,
  );
  return { onConfirm, onCancel, user: userEvent.setup() };
};

describe('ConfirmDialog', () => {
  it('shows the question, the text and both choices', () => {
    renderDialog();

    expect(screen.getByRole('dialog', { name: 'Foto löschen?' })).toBeInTheDocument();
    expect(screen.getByText('Das kann nicht rückgängig gemacht werden.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Löschen' })).toHaveClass('MuiButton-contained');
  });

  // Enter must never destroy anything by accident.
  it('marks a destructive action red and starts on the safe choice', () => {
    renderDialog({ destructive: true });

    expect(screen.getByRole('button', { name: 'Löschen' })).toHaveClass('MuiButton-colorError');
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toHaveFocus();
  });

  it('uses the primary colour and starts on the action otherwise', () => {
    renderDialog({ confirmLabel: 'Jetzt senden', cancelLabel: 'Später' });

    expect(screen.getByRole('button', { name: 'Jetzt senden' })).toHaveClass('MuiButton-colorPrimary');
    expect(screen.getByRole('button', { name: 'Jetzt senden' })).toHaveFocus();
  });

  it('calls the matching handler for each choice', async () => {
    const { onConfirm, onCancel, user } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Löschen' }));
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  // aria-disabled, not disabled: focus has to stay on the button that was pressed.
  it('locks both choices while the action runs without dropping focus', async () => {
    const { onConfirm, onCancel, user } = renderDialog({ loading: true, destructive: true });

    expect(screen.getByRole('button', { name: /Löschen/ })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: /Löschen/ }));
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('can block only the action', () => {
    renderDialog({ confirmDisabled: true });

    expect(screen.getByRole('button', { name: 'Löschen' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeEnabled();
  });

  // Long labels stack the buttons instead of breaking their text.
  it('keeps every label on one line', () => {
    renderDialog({ confirmLabel: 'Sendung abbrechen', cancelLabel: 'Weiter bearbeiten' });

    expect(screen.getByRole('button', { name: 'Sendung abbrechen' })).toHaveStyle({ whiteSpace: 'nowrap' });
    expect(screen.getByRole('button', { name: 'Weiter bearbeiten' })).toHaveStyle({ whiteSpace: 'nowrap' });
  });

  it('closes on the back button', async () => {
    const { onCancel } = renderDialog();

    await act(async () => window.history.back());

    await waitFor(() => expect(onCancel).toHaveBeenCalled());
  });

  it('leaves history alone when asked to', () => {
    const before = window.history.length;
    renderDialog({ backToClose: false });

    expect(window.history.length).toBe(before);
  });
});
