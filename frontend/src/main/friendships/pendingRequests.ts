import { IFriendship } from "@/types";

/**
 * Incoming friend requests that still need an answer: pending, addressed to the
 * user, and not already superseded by an accepted friendship with that person.
 */
export const getIncomingPendingRequests = (
    friendships: IFriendship[],
    username: string
): IFriendship[] =>
    friendships
        .filter((friendship) => friendship.status === "pending")
        .filter((friendship) => friendship.reciever === username)
        .filter((friendship) => {
            const friend = friendship.sender;

            return !friendships.some(
                (other) =>
                    other.status === "accepted" &&
                    ((other.sender === username && other.reciever === friend) ||
                        (other.reciever === username && other.sender === friend))
            );
        });
