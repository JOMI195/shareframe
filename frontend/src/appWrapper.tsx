import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import App from './App.tsx';
import { persistor, store } from './store/index.ts';
import ErrorBoundary from './common/components/error/errorBoundary/errorBoundary.tsx';

const AppWrapper = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <App />
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
};

export default AppWrapper;
