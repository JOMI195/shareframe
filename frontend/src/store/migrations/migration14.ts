import { RootState } from '..';

type LegacySettings = RootState['ui']['settings'] & { navigation?: unknown };

const migration14 = (state: RootState): RootState => {
  const { navigation: _navigation, ...settings } = state.ui.settings as LegacySettings;
  return {
    ...state,
    ui: { ...state.ui, settings },
  };
};

export default migration14;
