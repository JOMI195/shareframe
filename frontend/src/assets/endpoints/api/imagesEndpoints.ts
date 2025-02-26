export const getImagesUrl = () => "images/"

export const getImagesPaginatedUrl = (page: number = 1, page_size: number = 10) =>
    getImagesUrl() + `?page=${page}&page_size=${page_size}`;

export const getImagesDetailUrl = (imageId: number) => `${getImagesUrl()}${imageId}/`

export const getSentImagesUrl = () => "sent-images/"

export const getSentImagesDetailUrl = (sentImageId: number) => `${getSentImagesUrl()}${sentImageId}/`

export const getSentImagesDeactivateUrl = (sentImageId: number) => `${getSentImagesDetailUrl(sentImageId)}deactivate-sent-image/`