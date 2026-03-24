import { createBrowserRouter } from 'react-router-dom';
import LoadingFallback from '@/common/components/loadingFallback';
import MainLayout from '@/common/components/layout/layout';
import NotFound from '@/common/components/error/notFound/notFound';
import { getAuthenticationUrl } from '@/assets/endpoints/app/authEndpoints';
import Snackbars from '@/common/components/snackbars/snackbars';
import { getActivityUrl, getChangelogsUrl, getContactUrl, getFramesUrl, getFriendsUrl, getHomeUrl, getImageUrl } from '@/assets/endpoints/app/appEndpoints';
import { getSettingsUrl } from '@/assets/endpoints/app/settingEndpoints';
import ContactForm from '@/main/contact/contactForm';
import { getImprintUrl, getPrivacyPolicyUrl } from '@/assets/endpoints/app/legalEndpoints';
import PrivacyPolicy from '@/main/legals/privacyPolicy';
import Impressum from '@/main/legals/impressum';
import FeatureSelectorWrapper from '@/common/components/featureSelectorWrapper';
import authenticationRoutes from '@/main/authentication/authentication';
import settingsRoutes from '@/main/settings/settings';
import ProtectedRoute from '@/common/components/protectedRoute';
import Friendships from '@/main/friendships/friendships';
import Frames from '@/main/frames/frames';
import SentImages from '@/main/sentImages/sentImages';
import Images from '@/main/images/images';
import PublicLayout from '@/main/legals/layout';
import Home from '@/main/home/home';
import Changelogs from '@/main/changelogs/changelogs';

const Routing = createBrowserRouter([
  {
    element: <Snackbars />,
    HydrateFallback: LoadingFallback,
    children: [
      {
        path: "*",
        element: <NotFound />,
      },
      {
        path: getAuthenticationUrl(),
        element: <FeatureSelectorWrapper feature="authentication" />,
        children: authenticationRoutes,
      },
      {
        element: <PublicLayout />,
        children: [
          {
            element: <FeatureSelectorWrapper feature="legals" />,
            children: [
              {
                path: getContactUrl(),
                element: <ContactForm />,
              },
              {
                path: getPrivacyPolicyUrl(),
                element: <PrivacyPolicy />,
              },
              {
                path: getImprintUrl(),
                element: <Impressum />,
              },
            ],
          },
        ]
      },
      {
        element: <MainLayout />,
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
                    path: getHomeUrl(),
                    element: <Home />
                  },
                  {
                    path: getImageUrl(),
                    element: <Images />
                  },
                  {
                    path: getFriendsUrl(),
                    element: <Friendships />
                  },
                  {
                    path: getFramesUrl(),
                    element: <Frames />
                  },
                  {
                    path: getActivityUrl(),
                    element: <SentImages />
                  },
                  {
                    path: getChangelogsUrl(),
                    element: <Changelogs />
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
], {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});

export default Routing;
