export interface IFriendship {
    id: number;
    sender: string;
    reciever: string;
    status: "pending" | "rejected" | "accepted";
    created_at: string;
}

export interface IFriendshipCreateForm {
    reciever_friendship_user_search_code: string
}

export const isIFriendship = (obj: any): obj is IFriendship => {
    return (
        obj &&
        typeof obj.id === 'number' &&
        typeof obj.sender === 'string' &&
        typeof obj.reciever === 'string' &&
        typeof obj.status === 'string' &&
        typeof obj.created_at === 'string'
    );
}