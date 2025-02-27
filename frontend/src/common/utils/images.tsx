import { IImage, IImageVariant } from "@/types";

export const getVariant = (image: IImage, size: "thumbnail" | "medium" | "large"): IImageVariant | undefined => {
    return image.variants.find(variant => variant.size_name === size);
};
