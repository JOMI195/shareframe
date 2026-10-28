import { Provider } from 'react-redux';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { routes } from '@/routes/routing';
import { setupStore, type RootReducerState, type TestStore } from '@/store/setupStore';
import { ColorThemeProvider } from '@/context/colorTheme/colorThemeContext';
import { buildState, type DeepPartial } from './preloadedState';

type RouteNode = { lazy?: () => Promise<object>; children?: RouteNode[] };

// Resolved once up front so specs can query synchronously; e2e covers the real lazy loading.
const resolveLazyRoutes = async (nodes: RouteNode[]): Promise<void> => {
  await Promise.all(
    nodes.map(async (node) => {
      if (node.lazy) {
        Object.assign(node, await node.lazy());
        delete node.lazy;
      }
      if (node.children) await resolveLazyRoutes(node.children);
    }),
  );
};

await resolveLazyRoutes(routes as RouteNode[]);

export interface RenderRouteOptions {
  preloadedState?: RootReducerState | DeepPartial<RootReducerState>;
  store?: TestStore;
}

/**
 * Mounts the real route table at `path`. Use this for anything that spans more
 * than one screen; single components go through renderWithProviders.
 */
export const renderRoute = (path: string, options: RenderRouteOptions = {}) => {
  const { preloadedState, store = setupStore(buildState(preloadedState ?? {})) } =
    options;
  const router = createMemoryRouter(routes, { initialEntries: [path] });

  return {
    store,
    router,
    user: userEvent.setup(),
    ...render(
      <Provider store={store}>
        <ColorThemeProvider>
          <RouterProvider router={router} />
        </ColorThemeProvider>
      </Provider>,
    ),
  };
};
