import { RootState } from '..';

const migration11 = (state: RootState): RootState => {
  return {
    ...state,
    ui: {
      ...state.ui,
      settings: {
        ...state.ui.settings,
        pwa: { installPromptDismissed: false },
      },
    },
  };
};

export default migration11;
