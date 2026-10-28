import { createBrowserRouter } from 'react-router';
import LoadingFallback from '@/common/components/loadingFallback';
import NotFound from '@/common/components/error/notFound/notFound';
import { getAuthenticationUrl } from '@/assets/endpoints/app/authEndpoints';
import Snackbars from '@/common/components/snackbars/snackbars';
import { getActivityUrl, getChangelogsUrl, getContactUrl, getDashboardUrl, getFramesUrl, getFriendsUrl, getHomeUrl, getImageUrl } from '@/assets/endpoints/app/appEndpoints';
import { getSettingsUrl } from '@/assets/endpoints/app/settingEndpoints';
import ContactForm from '@/main/contact/contactForm';
import { getImprintUrl, getPrivacyPolicyUrl } from '@/assets/endpoints/app/legalEndpoints';
import PrivacyPolicy from '@/main/legals/privacyPolicy';
import Impressum from '@/main/legals/impressum';
import FeatureSelectorWrapper from '@/common/components/featureSelectorWrapper';
import authenticationRoutes from '@/main/authentication/authentication';
import settingsRoutes from '@/main/settings/settings';
import ProtectedRoute from '@/common/components/protectedRoute';
import PublicLayout from '@/main/legals/layout';
import SessionLayout from '@/common/components/layout/sessionLayout';
import PublicHeader from '@/common/components/layout/topLayout/publicHeader';
import Landing from '@/main/landing/landing';
import SeoHead from '@/seo/seoHead';
import { getUnsubscribePageUrl } from '@/assets/endpoints/app/notificationEndpoints';
import { lazyPage } from './lazyPage';

// Exported so tests can mount the real route tree with createMemoryRouter.
// eslint-disable-next-line react-refresh/only-export-components
export const routes = [
  {
    element: <SeoHead />,
    HydrateFallback: LoadingFallback,
    children: [
      {
        element: <Snackbars />,
        children: [
          {
            path: "*",
            element: <NotFound />,
          },
          {
            path: getHomeUrl(),
            element: <Landing />,
          },
          {
            path: getAuthenticationUrl(),
            element: (
              <>
                <PublicHeader />
                <FeatureSelectorWrapper feature="authentication" />
              </>
            ),
            children: authenticationRoutes,
          },
          {
            element: <PublicLayout />,
            children: [
              {
                element: <FeatureSelectorWrapper feature="legals" />,
                children: [
                  {
                    path: getPrivacyPolicyUrl(),
                    element: <PrivacyPolicy />,
                  },
                  {
                    path: getImprintUrl(),
                    element: <Impressum />,
                  },
                  {
                    path: getUnsubscribePageUrl() + ":token",
                    ...lazyPage(() => import('@/main/notifications/unsubscribe')),
                  },
                ],
              },
            ]
          },
          {
            element: <SessionLayout />,
            children: [
              {
                element: <FeatureSelectorWrapper feature="legals" />,
                children: [
                  {
                    path: getContactUrl(),
                    element: <ContactForm />,
                  },
                ],
              },
            ],
          },
          {
            ...lazyPage(() => import('@/common/components/layout/layout')),
            children: [
              {
                path: "*",
                element: <NotFound />,
              },
              {
                element: <ProtectedRoute />,
                children: [
                  {
                    element: <FeatureSelectorWrapper feature="app" />,
                    children: [
                      {
                        path: getDashboardUrl(),
                        ...lazyPage(() => import('@/main/home/home')),
                      },
                      {
                        path: getImageUrl(),
                        ...lazyPage(() => import('@/main/images/images')),
                      },
                      {
                        path: getFriendsUrl(),
                        ...lazyPage(() => import('@/main/friendships/friendships')),
                      },
                      {
                        path: getFramesUrl(),
                        ...lazyPage(() => import('@/main/frames/frames')),
                      },
                      {
                        path: getActivityUrl(),
                        ...lazyPage(() => import('@/main/sentImages/sentImages')),
                      },
                      {
                        path: getChangelogsUrl(),
                        ...lazyPage(() => import('@/main/changelogs/changelogs')),
                      }
                    ]
                  },
                  {
                    path: getSettingsUrl() + "*",
                    element: <FeatureSelectorWrapper feature="settings" />,
                    children: settingsRoutes,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

const Routing = createBrowserRouter(routes);

export default Routing;
