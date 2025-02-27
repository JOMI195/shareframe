import { RootState } from '..';

const migration5 = (state: RootState): RootState => {
  return {
    ...state,
    entities: {
      ...state.entities,
      images: {
        ...state.entities.images,
        imagesPaginated: {
          count: 0,
          next: null,
          previous: null,
          page: 1,
          results: []
        },
        sentImages: []
      }
    },
  };
};

export default migration5;
