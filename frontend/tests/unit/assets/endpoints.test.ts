import { describe, expect, it } from 'vitest';
import * as accounts from '@/assets/endpoints/api/accountsEndpoints';
import * as app from '@/assets/endpoints/api/appEndpoints';
import * as auth from '@/assets/endpoints/api/authEndpoints';
import * as changelogs from '@/assets/endpoints/api/changelogsEndpoints';
import * as contact from '@/assets/endpoints/api/contactEndpoints';
import * as dashboard from '@/assets/endpoints/api/dashboardEndpoints';
import * as frames from '@/assets/endpoints/api/framesEndpoints';
import * as friendships from '@/assets/endpoints/api/friendshipsEndpoints';
import * as images from '@/assets/endpoints/api/imagesEndpoints';

// The API contract every *.actions.tsx file depends on. A silent path change breaks this.
describe('api endpoints', () => {
  it('matches the backend routes', () => {
    expect({
      accounts: [accounts.getAccountListUrl(), accounts.getAccountItemUrl(7), accounts.getMyAccountUrl()],
      app: [app.getAppVersionUrl()],
      auth: [
        auth.getTokenCreateUrl(),
        auth.getTokenRefreshUrl(),
        auth.getTokenVerifyUrl(),
        auth.getTokenLogoutUrl(),
        auth.getCsrfUrl(),
        auth.getUserListUrl(),
        auth.getUserItemUrl(7),
        auth.getMyUserDataUrl(),
        auth.getUserActivationUrl(),
        auth.getUserActivationResendUrl(),
        auth.getSetPasswordUrl(),
        auth.getResetPasswordUrl(),
        auth.getResetPasswordConfirmUrl(),
        auth.getSetEmailUrl(),
        auth.getSetUsernameUrl(),
      ],
      changelogs: [
        changelogs.getChangelogsBaseUrl(),
        changelogs.getChangelogIdsUrl(),
        changelogs.getChangelogsByIdsUrl(),
      ],
      contact: [contact.getContactUrl()],
      dashboard: [dashboard.getDashboardUrl(), dashboard.getDashboardStatsUrl()],
      frames: [
        frames.getFramesUrl(),
        frames.getRegisterFrameUrl(),
        frames.getUnregisterFrameUrl(),
        frames.getSentImageToFrameUrl(),
        frames.getObtainFrameOtpUrl(7),
      ],
      friendships: [
        friendships.getFriendshipsUrl(),
        friendships.getFriendshipsSendRequestUrl(),
        friendships.getFriendshipsAcceptRequestUrl(7),
        friendships.getFriendshipsRejectRequestUrl(7),
        friendships.getFriendshipsDeleteRequestUrl(7),
      ],
      images: [
        images.getImagesUrl(),
        images.getImagesPaginatedUrl(),
        images.getImagesPaginatedUrl(3, 25),
        images.getImagesDetailUrl(7),
        images.getSentImagesUrl(),
        images.getSentImagesDetailUrl(7),
        images.getSentImagesDeactivateUrl(7),
      ],
    }).toMatchInlineSnapshot(`
      {
        "accounts": [
          "accounts/",
          "accounts/7/",
          "accounts/me/",
        ],
        "app": [
          "version/",
        ],
        "auth": [
          "auth/jwt/create/",
          "auth/jwt/refresh/",
          "auth/jwt/verify/",
          "auth/jwt/logout/",
          "auth/csrf/",
          "auth/users/",
          "auth/users/7/",
          "auth/users/me/",
          "auth/users/activation/",
          "auth/users/resend_activation/",
          "auth/users/set_password/",
          "auth/users/reset_password/",
          "auth/users/reset_password_confirm/",
          "auth/users/set_email/",
          "auth/users/set_username/",
        ],
        "changelogs": [
          "changelogs/",
          "changelogs/ids/",
          "changelogs/by-ids/",
        ],
        "contact": [
          "contactMe/",
        ],
        "dashboard": [
          "dashboard/",
          "dashboard/statistics/",
        ],
        "frames": [
          "frames/",
          "frames/register-user/",
          "frames/unregister-user/",
          "frames/send-image/",
          "frames/7/obtain-frame-otp/",
        ],
        "friendships": [
          "friendships/",
          "friendships/send-request/",
          "friendships/7/accept-request/",
          "friendships/7/reject-request/",
          "friendships/7/",
        ],
        "images": [
          "images/",
          "images/?page=1&page_size=10",
          "images/?page=3&page_size=25",
          "images/7/",
          "sent-images/",
          "sent-images/7/",
          "sent-images/7/deactivate-sent-image/",
        ],
      }
    `);
  });
});
