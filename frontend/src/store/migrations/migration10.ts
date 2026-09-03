import { PersistedState } from 'redux-persist';

const migration10 = (state: PersistedState): PersistedState => {
  if (!state) return state;

  const next: Record<string, unknown> = { ...state };
  delete next.auth;
  delete next.entities;

  return next as PersistedState;
};

export default migration10;
