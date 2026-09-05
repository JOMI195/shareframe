import { configureStore } from '@reduxjs/toolkit';
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import apiMiddleware from './middleware/api';
import rootReducer from './rootReducer';

export type RootReducerState = ReturnType<typeof rootReducer>;

export const serializableCheckOptions = {
  ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, 'api/request'],
};

// Isolated, unpersisted store. Kept out of ./index so importing it doesn't run persistStore.
export const setupStore = (preloadedState?: Partial<RootReducerState>) =>
  configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: serializableCheckOptions }).concat(apiMiddleware),
  });

export type TestStore = ReturnType<typeof setupStore>;
