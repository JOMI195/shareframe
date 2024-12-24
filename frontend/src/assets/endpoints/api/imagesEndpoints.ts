export const getImagesUrl = () => "images/"

export const getImagesDetailUrl = (imageId: number) => `${getImagesUrl()}${imageId}/`

export const getSentImagesUrl = () => "sent-images/"

export const getSentImagesDetailUrl = (sentImageId: number) => `${getSentImagesUrl()}${sentImageId}/`

export const getSentImagesDeactivateUrl = (sentImageId: number) => `${getSentImagesDetailUrl(sentImageId)}deactivate-sent-image/`