import { RootState } from '..';

const migration2 = (state: RootState): RootState => {
  return {
    ...state,
    ui: {
      ...state.ui,
      images: {
        ...state.ui.images,
        dialogs: {
          ...state.ui.images.dialogs,
          preview: {
            ...state.ui.images.dialogs.preview,
            selectedImage: null
          }
        },
      }
    },
  };
};

export default migration2;
