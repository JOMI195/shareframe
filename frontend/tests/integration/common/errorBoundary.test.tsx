import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import ErrorBoundary from '@/common/components/error/errorBoundary/errorBoundary';
import { renderWithProviders } from '@tests/helpers/renderWithProviders';

const Boom = () => {
  throw new Error('kaputt');
};

// LoadingFallback and FinalError need the theme, store and router.
const renderBoundary = () =>
  renderWithProviders(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>,
  );

beforeEach(() => {
  vi.useFakeTimers();
  // React logs the caught error; keep the run readable.
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    renderWithProviders(
      <ErrorBoundary>
        <div>Inhalt</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Inhalt')).toBeInTheDocument();
  });

  it('records the error in localStorage', () => {
    renderBoundary();

    expect(JSON.parse(localStorage.getItem('error_count')!)).toHaveLength(1);
  });

  // First error: drop the persisted store and reload after a short delay.
  it('clears the persisted state and reloads on the first error', () => {
    localStorage.setItem('persist:shareframe-data', '{}');

    renderBoundary();
    expect(window.location.reload).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2000);

    expect(localStorage.getItem('persist:shareframe-data')).toBeNull();
    expect(window.location.reload).toHaveBeenCalledOnce();
  });

  it('shows the loading fallback while waiting for the reload', () => {
    const { container } = renderBoundary();

    expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
  });

  // Second error: stop reloading and send the user to the contact page.
  it('shows the final error page on a repeat error', () => {
    localStorage.setItem('error_count', JSON.stringify([{ timestamp: '2026-01-01T00:00:00Z' }]));

    renderBoundary();

    expect(screen.getByText(/kontakt/i)).toBeInTheDocument();
    vi.advanceTimersByTime(2000);
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  it('clears the error log once the final page is shown', () => {
    localStorage.setItem('error_count', JSON.stringify([{ timestamp: '2026-01-01T00:00:00Z' }]));

    renderBoundary();

    expect(localStorage.getItem('error_count')).toBeNull();
  });

  it('keeps at most five entries in the log', () => {
    localStorage.setItem(
      'error_count',
      JSON.stringify(Array.from({ length: 8 }, (_, i) => ({ timestamp: `t${i}` }))),
    );

    renderBoundary();
    const log = JSON.parse(localStorage.getItem('error_count') ?? 'null');

    expect(log).toBeNull();
  });
});
