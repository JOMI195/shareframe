export const getImagesUrl = () => "images/"

export const getImagesPaginatedUrl = (page: number = 1, page_size: number = 10) =>
    getImagesUrl() + `?page=${page}&page_size=${page_size}`;

export const getImagesDetailUrl = (imageId: number) => `${getImagesUrl()}${imageId}/`

export const getSentImagesUrl = () => "sent-images/"

export const getSentImagesDetailUrl = (sentImageId: number) => `${getSentImagesUrl()}${sentImageId}/`

export const getSentImagesDeactivateUrl = (sentImageId: number) => `${getSentImagesDetailUrl(sentImageId)}deactivate-sent-image/`

export const getSentImagesCancelScheduledUrl = (sentImageId: number) => `${getSentImagesDetailUrl(sentImageId)}cancel-scheduled/`

export const getSentImagesSendNowUrl = (sentImageId: number) => `${getSentImagesDetailUrl(sentImageId)}send-now/`

export const getTextPresetsUrl = () => "text-presets/"

export const getTextPresetDetailUrl = (presetId: number) => `${getTextPresetsUrl()}${presetId}/`
