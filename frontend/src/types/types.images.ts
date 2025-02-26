export interface IImage {
    id: number;
    name: string;
    size: number;
    created_at: string;
    url: string;
}

export interface IImagesPaginated {
    count: number;
    next: string | null;
    previous: string | null;
    page: number;
    results: IImage[];
};

export const isIImage = (obj: any): obj is IImage => {
    return (
        obj &&
        typeof obj.id === 'number' &&
        typeof obj.name === 'string' &&
        typeof obj.size === 'number' &&
        typeof obj.created_at === 'string' &&
        typeof obj.url === 'string'
    );
}

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
