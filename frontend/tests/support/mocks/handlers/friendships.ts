import { http, HttpResponse } from 'msw';
import * as friendships from '@/assets/endpoints/api/friendshipsEndpoints';
import { makeFriendship } from '../../fixtures';
import { apiUrl, pathParam } from '../apiUrl';

export const friendshipHandlers = [
  http.get(apiUrl(friendships.getFriendshipsUrl()), () => HttpResponse.json([])),
  http.post(apiUrl(friendships.getFriendshipsSendRequestUrl()), () =>
    HttpResponse.json(makeFriendship({ status: 'pending' }), { status: 201 }),
  ),
  http.post(apiUrl(friendships.getFriendshipsAcceptRequestUrl(pathParam('friendshipId'))), ({ params }) =>
    HttpResponse.json(makeFriendship({ id: Number(params.friendshipId), status: 'accepted' })),
  ),
  http.post(apiUrl(friendships.getFriendshipsRejectRequestUrl(pathParam('friendshipId'))), ({ params }) =>
    HttpResponse.json(makeFriendship({ id: Number(params.friendshipId), status: 'rejected' })),
  ),
  http.delete(apiUrl(friendships.getFriendshipsDeleteRequestUrl(pathParam('friendshipId'))), ({ params }) =>
    HttpResponse.json(makeFriendship({ id: Number(params.friendshipId) })),
  ),
];
