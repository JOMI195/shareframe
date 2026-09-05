import { ReactElement, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupStore, TestStore, RootReducerState } from '@/store/setupStore';
import { ColorThemeProvider } from '@/context/colorTheme/colorThemeContext';
import { buildState, DeepPartial } from './preloadedState';

export interface ProviderOptions {
  preloadedState?: RootReducerState | DeepPartial<RootReducerState>;
  store?: TestStore;
  route?: string;
}

// No PersistGate: persistence is covered by the migration tests, and it makes every render async.
export const createWrapper = (options: ProviderOptions = {}) => {
  const {
    preloadedState,
    store = setupStore(preloadedState ? buildState(preloadedState) : undefined),
    route = '/',
  } = options;

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <ColorThemeProvider>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </ColorThemeProvider>
    </Provider>
  );

  return { store, Wrapper };
};

export const renderWithProviders = (
  ui: ReactElement,
  options: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {},
) => {
  const { preloadedState, store: given, route, ...renderOptions } = options;
  const { store, Wrapper } = createWrapper({ preloadedState, store: given, route });

  return {
    store,
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};
