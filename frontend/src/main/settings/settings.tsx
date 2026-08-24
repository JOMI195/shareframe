import { getDashboardUrl } from "@/assets/endpoints/app/appEndpoints";
import ProtectedRoute from "@/common/components/protectedRoute";
import NotFound from "@/common/components/error/notFound/notFound";
import Layout from "./layout";
import User from "./user/user";
import App from "./app/app";
import { getAppSettingsUrl, getUserSettingsUrl } from "@/assets/endpoints/app/settingEndpoints";

const settingsRoutes = [
  {
    path: "*",
    element: <NotFound />,
  },
  {
    element: <Layout />,
    children: [
      {
        path: getAppSettingsUrl(),
        element: <App />,
      },
      {
        element: <ProtectedRoute redirectPath={getDashboardUrl()} />,
        children: [
          {
            path: getUserSettingsUrl(),
            element: <User />,
          },
        ],
      },
    ],
  },
];

export default settingsRoutes;
