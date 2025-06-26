export interface IImageVariant {
    url: string;
    width: number;
    height: number | null;
    size_name: "thumbnail" | "medium" | "large";
}

export interface IImage {
    id: number;
    name: string;
    display_name: string;
    size: number;
    width: number;
    height: number;
    format: string;
    created_at: string;
    url: string;
    variants: IImageVariant[];
}

export interface IImagesPaginated {
    count: number;
    next: string | null;
    previous: string | null;
    page: number;
    results: IImage[];
};

export interface ISentImagesPaginated {
    count: number;
    next: string | null;
    previous: string | null;
    page: number;
    results: ISentImage[];
};

type StatusFilter = 'all' | 'active' | 'expired';
type ShippingFilter = 'all' | 'sentToYou' | 'sentByYou';
export interface ISentImagesFilters {
    status: StatusFilter;
    shipping: ShippingFilter;
    sender: string;
    receiver: string;
}

export const isIImage = (obj: any): obj is IImage => {
    return (
        obj &&
        typeof obj.id === 'number' &&
        typeof obj.name === 'string' &&
        typeof obj.size === 'number' &&
        typeof obj.width === 'number' &&
        typeof obj.height === 'number' &&
        typeof obj.format === 'string' &&
        typeof obj.created_at === 'string' &&
        typeof obj.url === 'string' &&
        Array.isArray(obj.variants) &&
        obj.variants.every(
            (variant: any) =>
                typeof variant.url === 'string' &&
                (variant.size_name === 'thumbnail' || variant.size_name === 'medium' || variant.size_name === 'large') &&
                typeof variant.width === 'number' &&
                (variant.height === null || typeof variant.height === 'number')
        )
    );
};

export interface IImageValidationResponse {
    valid: boolean;
    errors: string[];
}

export interface ISentImage {
    id: number;
    sender: string;
    reciever: string;
    image: IImage;
    sent_at: string;
    expires_at: string;
}
