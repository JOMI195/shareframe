import { RootState } from '..';

const migration12 = (state: RootState): RootState => {
  return {
    ...state,
    ui: {
      ...state.ui,
      settings: {
        ...state.ui.settings,
        pwa: { ...state.ui.settings.pwa, pushPromptDismissed: false },
      },
    },
  };
};

export default migration12;
