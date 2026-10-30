import { getDashboardUrl } from "@/assets/endpoints/app/appEndpoints";
import ProtectedRoute from "@/common/components/protectedRoute";
import NotFound from "@/common/components/error/notFound/notFound";
import Layout from "./layout";
import { lazyPage } from "@/routes/lazyPage";
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
        ...lazyPage(() => import("./app/app")),
      },
      {
        element: <ProtectedRoute redirectPath={getDashboardUrl()} />,
        children: [
          {
            path: getUserSettingsUrl(),
            ...lazyPage(() => import("./user/user")),
          },
        ],
      },
    ],
  },
];

export default settingsRoutes;
