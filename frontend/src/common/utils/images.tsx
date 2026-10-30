import { IImage, IImageVariant } from "@/types";

export const getVariant = (image: IImage, size: "thumbnail" | "medium" | "large"): IImageVariant | undefined => {
    return image.variants.find(variant => variant.size_name === size);
};

// Falls back to the original, so a missing variant never requests "undefined".
export const getVariantUrl = (image: IImage, size: "thumbnail" | "medium" | "large"): string =>
    getVariant(image, size)?.url ?? image.url;

// Same order as the backend's get_delivery_file: what a frame actually receives.
export const getDeliveryUrl = (image: IImage): string =>
    (getVariant(image, "large") ?? getVariant(image, "medium"))?.url ?? image.url;
