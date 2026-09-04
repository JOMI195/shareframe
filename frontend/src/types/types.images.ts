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
    auto_delete_after_period: boolean;
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

export type StatusFilter = 'all' | 'active' | 'expired';
export type ShippingFilter = 'all' | 'sentToYou' | 'sentByYou';
export interface ISentImagesFilters {
    status: StatusFilter;
    shipping: ShippingFilter;
    sender: string;
    receiver: string;
}

export const isIImage = (obj: unknown): obj is IImage => {
    const candidate = obj as IImage;

    return (
        candidate &&
        typeof candidate.id === 'number' &&
        typeof candidate.name === 'string' &&
        typeof candidate.size === 'number' &&
        typeof candidate.width === 'number' &&
        typeof candidate.height === 'number' &&
        typeof candidate.format === 'string' &&
        typeof candidate.created_at === 'string' &&
        typeof candidate.url === 'string' &&
        Array.isArray(candidate.variants) &&
        candidate.variants.every(
            (variant: IImageVariant) =>
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
