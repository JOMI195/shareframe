export interface IFriendship {
    id: number;
    sender: string;
    reciever: string;
    status: "pending" | "rejected" | "accepted";
    created_at: string;
    updated_at: string;
}

export interface IFriendshipCreateForm {
    reciever_friendship_user_search_code: string
}

export const isIFriendship = (obj: unknown): obj is IFriendship => {
    const candidate = obj as IFriendship;

    return (
        candidate &&
        typeof candidate.id === 'number' &&
        typeof candidate.sender === 'string' &&
        typeof candidate.reciever === 'string' &&
        typeof candidate.status === 'string' &&
        typeof candidate.created_at === 'string' &&
        typeof candidate.updated_at === 'string'
    );
}