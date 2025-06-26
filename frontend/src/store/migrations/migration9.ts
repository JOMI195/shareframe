import { RootState } from '..';

const migration9 = (state: RootState): RootState => {
  return {
    ...state,
    entities: {
      ...state.entities,
      images: {
        ...state.entities.images,
        sentImagesPaginated: {
          count: 0,
          next: null,
          previous: null,
          page: 1,
          results: []
        },
        sentImagesPaginatedPageSize: 10,
        sentImagesFilters: {
          status: 'all',
          shipping: 'all',
          sender: '',
          receiver: '',
        },
      }
    },
  };
};

export default migration9;
