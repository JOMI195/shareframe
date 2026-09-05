import { fireEvent, screen, waitFor } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';

type User = ReturnType<typeof userEvent.setup>;

/**
 * Opens the floating action dial and triggers one of its actions.
 *
 * The action buttons carry no accessible name — only a static tooltip label next
 * to them — and the dial root declares `pointer-events: none`, which userEvent
 * refuses to look past even once the action itself is enabled. Hence getByText
 * plus fireEvent.
 */
export const clickSpeedDialAction = async (user: User, label: string) => {
  // The dial opens on hover/focus; clicking an already open dial closes it.
  await user.hover(screen.getByRole('button', { name: 'Aktionen' }));

  const button = await waitFor(() => {
    const found = screen
      .getByText(label)
      .closest('.MuiSpeedDialAction-staticTooltip')!
      .querySelector('button')!;
    if (getComputedStyle(found).pointerEvents !== 'auto') {
      throw new Error(`Speed dial action "${label}" is not interactive yet`);
    }
    return found;
  });

  fireEvent.click(button);
  return button;
};

export const speedDialAction = (label: string) =>
  screen.getByText(label).closest('.MuiSpeedDialAction-staticTooltip')!.querySelector('button')!;
