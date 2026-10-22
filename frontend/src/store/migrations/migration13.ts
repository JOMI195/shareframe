import { RootState } from '..';

const migration13 = (state: RootState): RootState => {
  return {
    ...state,
    ui: {
      ...state.ui,
      settings: {
        ...state.ui.settings,
        design: { ...state.ui.settings.design, seasonalThemes: true },
      },
    },
  };
};

export default migration13;
