import { IFriendship, IUser } from '@/types';

export const getFriendAvatars = (friendships: IFriendship[], me: IUser) =>
    new Map<string, string | null | undefined>([
        ...friendships
            .filter(friendship => friendship.status === "accepted")
            .map((friendship): [string, string | null | undefined] => friendship.sender !== me.username
                ? [friendship.sender, friendship.sender_avatar]
                : [friendship.reciever, friendship.reciever_avatar]),
        [me.username, me.account?.avatar]
    ]);
