export const getFriendshipsUrl = () => "friendships/"

export const getFriendshipsSendRequestUrl = () => `${getFriendshipsUrl()}send-request/`

export const getFriendshipsAcceptRequestUrl = (friendshipId: number) => `${getFriendshipsUrl()}${friendshipId}/accept-request/`

export const getFriendshipsRejectRequestUrl = (friendshipId: number) => `${getFriendshipsUrl()}${friendshipId}/reject-request/`