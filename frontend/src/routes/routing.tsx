import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '@/common/components/layout/layout';
import NotFound from '@/common/components/error/notFound/notFound';
import Home from '@/main/home/home';
import { getAuthenticationUrl } from '@/assets/endpoints/app/authEndpoints';
import Snackbars from '@/common/components/snackbars/snackbars';
import { getContactUrl, getFramesUrl, getFriendsUrl, getHomeUrl } from '@/assets/endpoints/app/appEndpoints';
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

const Routing = createBrowserRouter([
  {
    element: <Snackbars />,
    children: [
      {
        path: getAuthenticationUrl(),
        element: <FeatureSelectorWrapper feature="authentication" />,
        children: authenticationRoutes,
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
                    element: <Home />,
                  },
                  {
                    path: getFriendsUrl(),
                    element: <Friendships />
                  },
                  {
                    path: getFramesUrl(),
                    element: <Frames />
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
          {
            element: <FeatureSelectorWrapper feature="app" />,
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
        ],
      },
    ],
  },
]);

export default Routing;
