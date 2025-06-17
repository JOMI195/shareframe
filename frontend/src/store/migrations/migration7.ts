import { RootState } from '..';

const migration7 = (state: RootState): RootState => {
    return {
        ...state,
        ui: {
            ...state.ui,
            images: {
                ...state.ui.images,
                dialogs: {
                    ...state.ui.images.dialogs,
                    delete: {
                        ...state.ui.images.dialogs.delete,
                        imagesToDelete: []
                    },
                    sendToFrame: {
                        ...state.ui.images.dialogs.sendToFrame,
                        imagesToSend: []
                    },
                    selection: {
                        open: false,
                        selectedImages: []
                    }
                },
            }
        },
    };
};

export default migration7;
