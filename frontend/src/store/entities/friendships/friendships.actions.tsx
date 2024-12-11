import * as friendshipsSlice from "./friendships.slice";
import { apiRequest } from "@/common/utils/constants/api.constants";
import * as friendshipsEndpoints from "@/assets/endpoints/api/friendshipsEndpoints";

export const fetchFriendships = () =>
  apiRequest({
    url: friendshipsEndpoints.getFriendshipsUrl(),
    onStart: friendshipsSlice.friendshipsRequested.type,
    onSuccess: friendshipsSlice.friendshipsReceived.type,
    onError: friendshipsSlice.friendshipsRequestFailed.type,
  });

export const sendFrindshipRequest = (reciever_friendship_user_search_code: string) =>
  apiRequest({
    url: friendshipsEndpoints.getFriendshipsSendRequestUrl(),
    method: "post",
    onStart: friendshipsSlice.sendFriendshipRequestPending.type,
    onSuccess: friendshipsSlice.sendFriendshipRequestFulfilled.type,
    onError: friendshipsSlice.sendFriendshipRequestFailed.type,
    data: { "reciever_friendship_user_search_code": reciever_friendship_user_search_code }
  });

export const acceptFrindshipRequest = (friendshipId: number) =>
  apiRequest({
    url: friendshipsEndpoints.getFriendshipsAcceptRequestUrl(friendshipId),
    method: "post",
    onStart: friendshipsSlice.acceptFriendshipRequestPending.type,
    onSuccess: friendshipsSlice.acceptFriendshipRequestFulfilled.type,
    onError: friendshipsSlice.acceptFriendshipRequestFailed.type,
    data: {}
  });

export const rejectFrindshipRequest = (friendshipId: number) =>
  apiRequest({
    url: friendshipsEndpoints.getFriendshipsRejectRequestUrl(friendshipId),
    method: "post",
    onStart: friendshipsSlice.rejectFriendshipRequestPending.type,
    onSuccess: friendshipsSlice.rejectFriendshipRequestFulfilled.type,
    onError: friendshipsSlice.rejectFriendshipRequestFailed.type,
    data: {}
  });