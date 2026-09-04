import { configureStore } from '@reduxjs/toolkit';
import { ThunkDispatch } from 'redux-thunk';
import { Action } from 'redux';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import apiMiddleware from "./middleware/api";
import {
  persistStore,
  persistReducer,
  PersistConfig,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  createMigrate,
  createTransform,
  PersistedState,
} from 'redux-persist';
import storage from 'redux-persist/es/storage';
import rootReducer from './rootReducer';
import autoMergeLevel2 from 'redux-persist/es/stateReconciler/autoMergeLevel2';
import migrations from './migrations';

// A root whitelist only filters top-level keys, so `ui` needs narrowing on the way to storage.
type PersistedUi = Record<string, unknown>;

const uiSubsetTransform = createTransform<PersistedUi, PersistedUi>(
  (inbound) => ({ settings: inbound?.settings, changelogs: inbound?.changelogs }),
  (outbound) => outbound,
  { whitelist: ['ui'] },
);

type RootReducerState = ReturnType<typeof rootReducer>;

const persistConfig: PersistConfig<RootReducerState> = {
  key: 'shareframe-data',
  version: 10,
  storage,
  whitelist: ['ui'],
  transforms: [uiSubsetTransform],
  stateReconciler: autoMergeLevel2,
  migrate: createMigrate(migrations, { debug: import.meta.env.VITE_APP_PRODUCTION === "False" ? true : false }),
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, "api/request"],
      },
    }).concat(apiMiddleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer> & PersistedState;

export type AppDispatch = typeof store.dispatch & ThunkDispatch<RootState, undefined, Action>;;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
