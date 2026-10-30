import { describe, expect, it } from 'vitest';
import * as frames from '@/store/entities/frames/frames.actions';
import * as friendships from '@/store/entities/friendships/friendships.actions';
import * as auth from '@/store/entities/authentication/authentication.actions';
import * as images from '@/store/entities/images/images.actions';
import * as changelogs from '@/store/entities/changelogs/changelogs.actions';
import * as dashboard from '@/store/entities/dashboard/dashboard.actions';
import * as contact from '@/store/entities/contact/contact.actions';
import { signedOut } from '@/store/entities/authentication/authentication.slice';
import { defaultState } from '@tests/helpers/preloadedState';
import { makeChangelog, makeChangelogId } from '@tests/fixtures';

// Every creator is a pure function returning an api/request action. The snapshot
// pins url, method, data and the three lifecycle action types in one place.
describe('api request actions', () => {
  it('build the expected api/request payloads', () => {
    expect({
      dashboard: dashboard.fetchDashboardStats(),
      contact: contact.sendContactEmail({ name: 'A', email: 'a@b.de', subject: 'S', message: 'M' }),
      framesFetch: frames.fetchframes(),
      framesRegister: frames.registerFrame('AAAA-BBBB-CCCC-DDDD'),
      framesUnregister: frames.unregisterFrame('AAAA-BBBB-CCCC-DDDD'),
      framesOtp: frames.obtainFrameOTP(7),
      friendshipsFetch: friendships.fetchFriendships(),
      friendshipsSend: friendships.sendFrindshipRequest('ABCD1234'),
      friendshipsAccept: friendships.acceptFrindshipRequest(7),
      friendshipsReject: friendships.rejectFrindshipRequest(7),
      friendshipsDelete: friendships.deleteFriendship(7),
      imagesFetch: images.fetchImages(2, 20),
      imagesDelete: images.deleteImage(7, 'photo.jpg'),
      imagesSendToFrame: images.sendImageToUserFrames('bob', 7, '1800000000'),
      imagesDeactivate: images.deactivateSentImage(7),
      changelogIds: changelogs.fetchChangelogIds(),
      changelogsByIds: changelogs.fetchChangelogsByIds([1, 2]),
    }).toMatchInlineSnapshot(`
      {
        "changelogIds": {
          "payload": {
            "onError": "changelogs/changelogIdsRequestFailed",
            "onStart": "changelogs/changelogIdsRequested",
            "onSuccess": "changelogs/changelogIdsReceived",
            "url": "changelogs/ids/",
          },
          "type": "api/request",
        },
        "changelogsByIds": {
          "payload": {
            "data": {
              "ids": [
                1,
                2,
              ],
            },
            "method": "post",
            "onError": "changelogs/changelogsRequestFailed",
            "onStart": "changelogs/changelogsRequested",
            "onSuccess": "changelogs/changelogsReceived",
            "url": "changelogs/by-ids/",
          },
          "type": "api/request",
        },
        "contact": {
          "payload": {
            "data": {
              "email": "a@b.de",
              "message": "M",
              "name": "A",
              "subject": "S",
            },
            "method": "post",
            "onError": "contact/contactEmailSendingFailed",
            "onStart": "contact/contactEmailSendingPending",
            "onSuccess": "contact/contactEmailSendingFulfilled",
            "onSuccessPayload": true,
            "url": "contactMe/",
          },
          "type": "api/request",
        },
        "dashboard": {
          "payload": {
            "onError": "dashboard/dashboardStatsRequestFailed",
            "onStart": "dashboard/dashboardStatsRequested",
            "onSuccess": "dashboard/dashboardStatsReceived",
            "url": "dashboard/statistics/",
          },
          "type": "api/request",
        },
        "framesFetch": {
          "payload": {
            "onError": "frames/framesRequestFailed",
            "onStart": "frames/framesRequested",
            "onSuccess": "frames/framesReceived",
            "url": "frames/",
          },
          "type": "api/request",
        },
        "framesOtp": {
          "payload": {
            "method": "post",
            "onError": "frames/frameOTPRequestFailed",
            "onStart": "frames/frameOTPRequested",
            "onSuccess": "frames/frameOTPRecieved",
            "url": "frames/7/obtain-frame-otp/",
          },
          "type": "api/request",
        },
        "framesRegister": {
          "payload": {
            "data": {
              "public_serial_number": "AAAA-BBBB-CCCC-DDDD",
            },
            "method": "post",
            "onError": "frames/registerFrameFailed",
            "onStart": "frames/registerFramePending",
            "onSuccess": "frames/registerFrameFulfilled",
            "url": "frames/register-user/",
          },
          "type": "api/request",
        },
        "framesUnregister": {
          "payload": {
            "data": {
              "public_serial_number": "AAAA-BBBB-CCCC-DDDD",
            },
            "method": "post",
            "onError": "frames/unregisterFrameFailed",
            "onStart": "frames/unregisterFramePending",
            "onSuccess": "frames/unregisterFrameFulfilled",
            "url": "frames/unregister-user/",
          },
          "type": "api/request",
        },
        "friendshipsAccept": {
          "payload": {
            "data": {},
            "method": "post",
            "onError": "friendships/acceptFriendshipRequestFailed",
            "onStart": "friendships/acceptFriendshipRequestPending",
            "onSuccess": "friendships/acceptFriendshipRequestFulfilled",
            "url": "friendships/7/accept-request/",
          },
          "type": "api/request",
        },
        "friendshipsDelete": {
          "payload": {
            "method": "delete",
            "onError": "friendships/friendshipDeleteDeleteFailed",
            "onStart": "friendships/friendshipDeleteRequested",
            "onSuccess": "friendships/friendshipDeleteDeleteFulfilled",
            "url": "friendships/7/",
          },
          "type": "api/request",
        },
        "friendshipsFetch": {
          "payload": {
            "onError": "friendships/friendshipsRequestFailed",
            "onStart": "friendships/friendshipsRequested",
            "onSuccess": "friendships/friendshipsReceived",
            "url": "friendships/",
          },
          "type": "api/request",
        },
        "friendshipsReject": {
          "payload": {
            "data": {},
            "method": "post",
            "onError": "friendships/rejectFriendshipRequestFailed",
            "onStart": "friendships/rejectFriendshipRequestPending",
            "onSuccess": "friendships/rejectFriendshipRequestFulfilled",
            "url": "friendships/7/reject-request/",
          },
          "type": "api/request",
        },
        "friendshipsSend": {
          "payload": {
            "data": {
              "reciever_friendship_user_search_code": "ABCD1234",
            },
            "method": "post",
            "onError": "friendships/sendFriendshipRequestFailed",
            "onStart": "friendships/sendFriendshipRequestPending",
            "onSuccess": "friendships/sendFriendshipRequestFulfilled",
            "url": "friendships/send-request/",
          },
          "type": "api/request",
        },
        "imagesDeactivate": {
          "payload": {
            "method": "post",
            "onError": "images/deactivateSentImageFailed",
            "onStart": "images/deactivateSentImagePending",
            "onSuccess": "images/deactivateSentImageFulfilled",
            "url": "sent-images/7/deactivate-sent-image/",
          },
          "type": "api/request",
        },
        "imagesDelete": {
          "payload": {
            "method": "delete",
            "onError": "images/deleteImageFailed",
            "onStart": "images/deleteImagePending",
            "onStartPayload": "photo.jpg",
            "onSuccess": "images/deleteImageFulfilled",
            "url": "images/7/",
          },
          "type": "api/request",
        },
        "imagesFetch": {
          "payload": {
            "onError": "images/imagesRequestFailed",
            "onStart": "images/imagesRequested",
            "onSuccess": "images/imagesReceived",
            "url": "images/?page=2&page_size=20",
          },
          "type": "api/request",
        },
        "imagesSendToFrame": {
          "payload": {
            "data": {
              "expiry_unix_timestamp": "1800000000",
              "image_id": 7,
              "reciever_username": "bob",
            },
            "method": "post",
            "onError": "images/sendImageToUserFrameFailed",
            "onStart": "images/sendImageToUserFramePending",
            "onSuccess": "images/sendImageToUserFrameFulfilled",
            "url": "frames/send-image/",
          },
          "type": "api/request",
        },
      }
    `);
  });

  it('sends an upload as multipart with the file name as the start payload', () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });

    const action = images.uploadImage(file, 'deadbeef', false);

    expect(action.payload.method).toBe('post');
    expect(action.payload.headers).toEqual({ 'content-type': 'multipart/form-data' });
    expect(action.payload.onStartPayload).toBe('photo.jpg');
    expect(action.payload.data).toEqual({
      image: file,
      upload_image_sha256_hex_hash: 'deadbeef',
      auto_delete_after_period: false,
    });
  });

  it('falls back to a null start payload for an unnamed file', () => {
    expect(images.uploadImage(new File(['x'], ''), 'deadbeef').payload.onStartPayload).toBeNull();
  });

  // A failed sign-out must not strand a signed-in UI, so both outcomes reset.
  it('resets on both outcomes of signOutUser', () => {
    const { onSuccess, onError } = auth.signOutUser().payload;
    expect(onSuccess).toBe(signedOut.type);
    expect(onError).toBe(signedOut.type);
  });
});

describe('fetchSentImagesPaginated', () => {
  const url = (...args: Parameters<typeof images.fetchSentImagesPaginated>) =>
    images.fetchSentImagesPaginated(...args).payload.url;

  it('always sends page and page size', () => {
    expect(url()).toBe('sent-images/?page=1&page_size=12');
    expect(url(3, 25)).toBe('sent-images/?page=3&page_size=25');
  });

  it('skips the "all" sentinels and empty strings', () => {
    expect(url(1, 12, { status: 'all', shipping: 'all', sender: '', receiver: '' })).toBe(
      'sent-images/?page=1&page_size=12',
    );
  });

  it('appends only the active filters', () => {
    expect(url(1, 12, { status: 'active', shipping: 'sentByYou', sender: 'alice', receiver: 'bob' })).toBe(
      'sent-images/?page=1&page_size=12&status=active&shipping=sentByYou&sender=alice&receiver=bob',
    );
  });

  it('url-encodes filter values', () => {
    expect(url(1, 12, { sender: 'a b&c' })).toContain('sender=a+b%26c');
  });
});

describe('plain page actions', () => {
  it('carry the page and size as a scalar payload', () => {
    expect(images.setImagesPaginatedPage(3)).toEqual({ type: 'images/imagesPageSet', payload: 3 });
    expect(images.setImagesPaginatedPageSize(25)).toEqual({ type: 'images/imagesPageSizeSet', payload: 25 });
    expect(images.setSentImagesFilters({ status: 'active' })).toEqual({
      type: 'images/sentImagesFiltersSet',
      payload: { status: 'active' },
    });
  });
});

const runThunk = (thunk: (dispatch: never, getState: never) => void, state: ReturnType<typeof defaultState>) => {
  const dispatched: { payload?: { url?: string; data?: unknown } }[] = [];
  const dispatch = (action: unknown): unknown =>
    typeof action === 'function'
      ? action(dispatch, () => state)
      : dispatched.push(action as never);
  thunk(dispatch as never, (() => state) as never);
  return dispatched;
};

describe('fetchNewestChangelog', () => {
  const run = (ids: { id: number; date: string }[], deactivated: number[] = [], loaded: number[] = []) => {
    const state = defaultState();
    state.entities.changelogs.changelogIds = ids.map((id) => makeChangelogId(id));
    state.entities.changelogs.changelogs = loaded.map((id) => makeChangelog({ id }));
    state.ui.changelogs.deactivatedIds = deactivated;
    return runThunk(changelogs.fetchNewestChangelog(), state);
  };
  const ids = [
    { id: 1, date: '2026-01-01' },
    { id: 2, date: '2026-03-01' },
    { id: 3, date: '2026-02-01' },
  ];

  it('requests only the newest entry by date', () => {
    const dispatched = run(ids);

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0].payload?.data).toEqual({ ids: [2] });
  });

  it('requests nothing when the newest entry is dismissed', () => {
    expect(run(ids, [2])).toHaveLength(0);
  });

  it('requests nothing when the newest entry is already loaded', () => {
    expect(run(ids, [], [2])).toHaveLength(0);
  });

  it('requests nothing before the ids are loaded', () => {
    expect(run([])).toHaveLength(0);
  });
});

describe('fetchMissingChangelogs', () => {
  const run = (ids: number[], loaded: number[]) => {
    const state = defaultState();
    state.entities.changelogs.changelogs = loaded.map((id) => makeChangelog({ id }));
    return runThunk(changelogs.fetchMissingChangelogs(ids), state);
  };

  it('requests only the entries that are not loaded yet', () => {
    expect(run([1, 2, 3], [2])[0].payload?.data).toEqual({ ids: [1, 3] });
  });

  it('requests nothing when everything is loaded', () => {
    expect(run([1, 2], [1, 2])).toHaveLength(0);
  });
});

describe('fetch if stale', () => {
  const MINUTE = 60 * 1000;
  const cases = [
    {
      name: 'changelog ids',
      thunk: changelogs.fetchChangelogIdsIfStale,
      maxAge: 5 * MINUTE,
      setLastFetch: (state: ReturnType<typeof defaultState>, at: number | null) => {
        state.entities.changelogs.api.idsLastFetch = at;
      },
    },
    {
      name: 'friendships',
      thunk: friendships.fetchFriendshipsIfStale,
      maxAge: MINUTE,
      setLastFetch: (state: ReturnType<typeof defaultState>, at: number | null) => {
        state.entities.friendships.api.lastFetch = at;
      },
    },
    {
      name: 'frames',
      thunk: frames.fetchFramesIfStale,
      maxAge: 30 * 1000,
      setLastFetch: (state: ReturnType<typeof defaultState>, at: number | null) => {
        state.entities.frames.api.lastFetch = at;
      },
    },
  ];

  const run = (testCase: (typeof cases)[number], lastFetch: number | null) => {
    const state = defaultState();
    testCase.setLastFetch(state, lastFetch);
    return runThunk(testCase.thunk(), state);
  };

  it.each(cases)('fetches $name that were never loaded', (testCase) => {
    expect(run(testCase, null)).toHaveLength(1);
  });

  it.each(cases)('skips $name that are still fresh', (testCase) => {
    expect(run(testCase, Date.now() - testCase.maxAge + MINUTE / 60)).toHaveLength(0);
  });

  it.each(cases)('refetches $name once they are stale', (testCase) => {
    expect(run(testCase, Date.now() - testCase.maxAge - 1)).toHaveLength(1);
  });

  it.each(cases)('asks for $name once while a request is under way', (testCase) => {
    const state = defaultState();
    testCase.setLastFetch(state, null);
    const dispatched: unknown[] = [];
    const pending = new Promise(() => undefined);
    const dispatch = (action: unknown): unknown =>
      typeof action === 'function' ? action(dispatch, () => state) : (dispatched.push(action), pending);

    dispatch(testCase.thunk());
    dispatch(testCase.thunk());

    expect(dispatched).toHaveLength(1);
  });
});

describe('loadMyUserProfileShared', () => {
  it('shares one request between callers', () => {
    const dispatched: unknown[] = [];
    const pending = new Promise(() => undefined);
    const dispatch = (action: unknown): unknown =>
      typeof action === 'function' ? action(dispatch) : (dispatched.push(action), pending);

    dispatch(auth.loadMyUserProfileShared());
    dispatch(auth.loadMyUserProfileShared());

    expect(dispatched).toHaveLength(1);
  });
});
