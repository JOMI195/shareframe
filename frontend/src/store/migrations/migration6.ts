import { RootState } from '..';

const migration6 = (state: RootState): RootState => {
    return {
        ...state,
        entities: {
            ...state.entities,
            frames: {
                ...state.entities.frames,
                api: {
                    ...state.entities.frames.api,
                    otpLoading: false,
                }
            }
        },
        ui: {
            ...state.ui,
            frames: {
                ...state.ui.frames,
                dialogs: {
                    ...state.ui.frames.dialogs,
                    requestOTP: {
                        open: false,
                        frameId: null
                    }
                },
            }
        },
    };
};

export default migration6;
