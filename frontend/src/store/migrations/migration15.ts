import { RootState } from '..';

const migration15 = (state: RootState): RootState => {
  return {
    ...state,
    ui: {
      ...state.ui,
      settings: {
        ...state.ui.settings,
        upload: { autoDelete: true },
      },
    },
  };
};

export default migration15;
