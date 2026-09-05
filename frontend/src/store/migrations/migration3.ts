import { RootState } from '..';

const migration3 = (state: RootState): RootState => {
  return {
    ...state,
    ui: {
      ...state.ui,
      sentImages: {
        ...state.ui.sentImages,
        dialogs: {
          ...state.ui.sentImages.dialogs,
          preview: {
            ...state.ui.sentImages.dialogs.preview,
            selectedSentImage: null
          }
        },
      }
    },
  };
};

export default migration3;
