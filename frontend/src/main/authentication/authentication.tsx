import {
  getActivationUrl,
  getEmailChangeConfirmationUrl,
  getResetPasswordConfirmationUrl,
  getResetPasswordUrl,
  getSignInUrl,
  getSignOutUrl,
  getSignUpConfirmationUrl,
  getUsersUrl,
} from "@/assets/endpoints/app/authEndpoints";
import Layout from "./layout";
import { lazyPage } from "@/routes/lazyPage";
import NotFound from "@/common/components/error/notFound/notFound";

const authenticationRoutes = [
  {
    path: "*",
    element: <NotFound />,
  },
  {
    element: <Layout />,
    children: [
      {
        path: getSignInUrl(),
        ...lazyPage(() => import("./signIn/signIn")),
      },
      {
        path: getSignOutUrl(),
        ...lazyPage(() => import("./signOut/signOut")),
      },
      // {
      //   path: getSignUpUrl(),
      //   element: <SignUp />,
      // },
      {
        path: getUsersUrl(),
        children: [
          {
            path: getSignUpConfirmationUrl(),
            ...lazyPage(() => import("./signUp/signUpConfirmation")),
          },
          {
            path: getActivationUrl(),
            ...lazyPage(() => import("./users/activation")),
          },
          {
            path: getEmailChangeConfirmationUrl(),
            ...lazyPage(() => import("./users/emailChangeConfirmation")),
          },
          {
            path: getResetPasswordUrl(),
            ...lazyPage(() => import("./users/passwordReset")),
          },
          {
            path: getResetPasswordConfirmationUrl(),
            ...lazyPage(() => import("./users/passwordResetConfirmation")),
          },
        ],
      },
    ],
  },
];

export default authenticationRoutes;
