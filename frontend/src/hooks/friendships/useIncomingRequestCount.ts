import { useMemo } from 'react';
import { useAppSelector } from '@/store';
import { getFriendships } from '@/store/entities/friendships/friendships.slice';
import { getUser } from '@/store/entities/authentication/authentication.slice';
import { getIncomingPendingRequests } from '@/main/friendships/pendingRequests';

export const useIncomingRequestCount = () => {
    const friendships = useAppSelector(getFriendships);
    const username = useAppSelector((state) => getUser(state).me.username);
    return useMemo(() => getIncomingPendingRequests(friendships, username).length, [friendships, username]);
};
