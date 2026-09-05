import { http, HttpResponse, type RequestHandler } from 'msw';
import * as authEndpoints from '@/assets/endpoints/api/authEndpoints';
import * as changelogEndpoints from '@/assets/endpoints/api/changelogsEndpoints';
import * as dashboardEndpoints from '@/assets/endpoints/api/dashboardEndpoints';
import * as frameEndpoints from '@/assets/endpoints/api/framesEndpoints';
import * as friendshipEndpoints from '@/assets/endpoints/api/friendshipsEndpoints';
import * as imageEndpoints from '@/assets/endpoints/api/imagesEndpoints';
import type {
  IChangelog,
  IChangelogId,
} from '@/types/types.changelogs';
import type { IDashboardData, IFrame, IFriendship, IImage, ISentImage, IUser } from '@/types';
import { makePage } from '../fixtures';
import { apiUrl } from './apiUrl';

type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';

/** Signed-in identity returned by auth/users/me/. */
export const withUser = (user: IUser): RequestHandler[] => [
  http.get(apiUrl(authEndpoints.getMyUserDataUrl()), () => HttpResponse.json(user)),
];

/** A populated photo library. `total` drives the pagination controls. */
export const withImages = (images: IImage[], total = images.length): RequestHandler[] => [
  http.get(apiUrl(imageEndpoints.getImagesUrl()), ({ request }) => {
    const page = Number(new URL(request.url).searchParams.get('page') ?? 1);
    return HttpResponse.json(makePage(images, { count: total, page }));
  }),
];

export const withSentImages = (sentImages: ISentImage[], total = sentImages.length): RequestHandler[] => [
  http.get(apiUrl(imageEndpoints.getSentImagesUrl()), ({ request }) => {
    const page = Number(new URL(request.url).searchParams.get('page') ?? 1);
    return HttpResponse.json(makePage(sentImages, { count: total, page }));
  }),
];

export const withFrames = (frames: IFrame[]): RequestHandler[] => [
  http.get(apiUrl(frameEndpoints.getFramesUrl()), () => HttpResponse.json(frames)),
];

export const withFriendships = (friendships: IFriendship[]): RequestHandler[] => [
  http.get(apiUrl(friendshipEndpoints.getFriendshipsUrl()), () => HttpResponse.json(friendships)),
];

export const withDashboard = (data: IDashboardData): RequestHandler[] => [
  http.get(apiUrl(dashboardEndpoints.getDashboardStatsUrl()), () => HttpResponse.json(data)),
];

export const withChangelogs = (entries: IChangelog[]): RequestHandler[] => [
  http.get(apiUrl(changelogEndpoints.getChangelogIdsUrl()), () =>
    HttpResponse.json(entries.map(({ id, date, title, is_published }): IChangelogId => ({ id, date, title, is_published }))),
  ),
  http.post(apiUrl(changelogEndpoints.getChangelogsByIdsUrl()), async ({ request }) => {
    const { ids } = (await request.json()) as { ids: number[] };
    return HttpResponse.json(entries.filter((entry) => ids.includes(entry.id)));
  }),
];

/** No valid session: every authenticated read 401s. */
export const signedOut = (): RequestHandler[] => [
  http.get(apiUrl(authEndpoints.getMyUserDataUrl()), () =>
    HttpResponse.json({ detail: 'Given token not valid for any token type' }, { status: 401 }),
  ),
];

/** Generic failure override, e.g. failsWith('post', imageEndpoints.getImagesUrl(), 413). */
export const failsWith = (
  method: Method,
  path: string,
  status: number,
  body: Record<string, unknown> = { detail: 'Fehler' },
): RequestHandler[] => [http[method](apiUrl(path), () => HttpResponse.json(body, { status }))];

/**
 * Records the requests hitting one endpoint so a test can assert on the query
 * string or the multipart body it sent.
 */
export const spyOnRequests = (
  method: Method,
  path: string,
  respond: () => Response = () => HttpResponse.json({}),
) => {
  const calls: Request[] = [];
  const handler = http[method](apiUrl(path), ({ request }) => {
    calls.push(request.clone());
    return respond();
  });

  return { handler, calls };
};
