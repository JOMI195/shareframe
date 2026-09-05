import { describe, expect, it, vi } from 'vitest';
import * as frames from '@/store/entities/frames/frames.actions';
import * as friendships from '@/store/entities/friendships/friendships.actions';
import * as auth from '@/store/entities/authentication/authentication.actions';
import * as images from '@/store/entities/images/images.actions';
import * as changelogs from '@/store/entities/changelogs/changelogs.actions';
import * as dashboard from '@/store/entities/dashboard/dashboard.actions';
import * as contact from '@/store/entities/contact/contact.actions';
import * as app from '@/store/entities/app/app.actions';
import { signedOut } from '@/store/entities/authentication/authentication.slice';
import { changelogsReceived } from '@/store/entities/changelogs/changelogs.slice';
import { defaultState } from '@tests/helpers/preloadedState';
import { makeChangelogId } from '@tests/fixtures';

// Every creator is a pure function returning an api/request action. The snapshot
// pins url, method, data and the three lifecycle action types in one place.
describe('api request actions', () => {
  it('build the expected api/request payloads', () => {
    expect({
      app: app.fetchAppVersion(),
      dashboard: dashboard.fetchDashboardStats(),
      contact: contact.sendContactEmail({ name: 'A', email: 'a@b.de', subject: 'S', message: 'M' }),
      framesFetch: frames.fetchframes(),
      framesRegister: frames.registerFrame('AAAAA-BBBBB-CCCCC-DDDDD-EEEEE'),
      framesUnregister: frames.unregisterFrame('AAAAA-BBBBB-CCCCC-DDDDD-EEEEE'),
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
        "app": {
          "payload": {
            "method": "get",
            "onError": "app/versionRequestedFailed",
            "onStart": "app/versionRequestedPending",
            "onSuccess": "app/versionRequestedFulfilled",
            "url": "version/",
          },
          "type": "api/request",
        },
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
              "public_serial_number": "AAAAA-BBBBB-CCCCC-DDDDD-EEEEE",
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
              "public_serial_number": "AAAAA-BBBBB-CCCCC-DDDDD-EEEEE",
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

describe('fetchActiveChangelogs', () => {
  const run = (ids: number[], deactivated: number[]) => {
    const state = defaultState();
    state.entities.changelogs.changelogIds = ids.map((id) => makeChangelogId({ id }));
    state.ui.changelogs.deactivatedIds = deactivated;

    const dispatch = vi.fn();
    changelogs.fetchActiveChangelogs()(dispatch as never, () => state as never);
    return dispatch;
  };

  it('requests only the non-dismissed ids', () => {
    const dispatch = run([1, 2, 3], [2]);

    expect(dispatch).toHaveBeenCalledOnce();
    expect(dispatch.mock.calls[0][0].payload.data).toEqual({ ids: [1, 3] });
  });

  // Short-circuits instead of firing a request for an empty id list.
  it('resolves to an empty list when everything is dismissed', () => {
    const dispatch = run([1, 2], [1, 2]);
    expect(dispatch).toHaveBeenCalledWith(changelogsReceived([]));
  });

  it('resolves to an empty list when no ids are loaded yet', () => {
    expect(run([], [])).toHaveBeenCalledWith(changelogsReceived([]));
  });
});
