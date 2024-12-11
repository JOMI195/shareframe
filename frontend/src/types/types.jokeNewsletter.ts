export interface INewsletterRecieverSubscribeResponse {
    reciever: string;
}

export const isINewsletterRecieverSubscribeResponse = (obj: any): obj is INewsletterRecieverSubscribeResponse => {
    return (
        obj &&
        typeof obj.reciever === 'string'
    );
}
