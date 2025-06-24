import { RootState } from '..';

const migration8 = (state: RootState): RootState => {
    return {
        ...state,
        entities: {
            ...state.entities,
            images: {
                ...state.entities.images,
                api: {
                    ...state.entities.images.api,
                    sending: false,
                },
            },
        },
    };
};

export default migration8;
