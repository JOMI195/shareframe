import {
  getActivationUrl,
  getResetPasswordConfirmationUrl,
  getResetPasswordUrl,
  getSignInUrl,
  getSignOutUrl,
  getSignUpConfirmationUrl,
  getSignUpUrl,
  getUsersUrl,
} from "@/assets/endpoints/app/authEndpoints";
import Layout from "./layout";
import SignIn from "./signIn/signIn";
import SignOut from "./signOut/signOut";
import SignUp from "./signUp/signUp";
import Activation from "./users/activation";
import PasswordReset from "./users/passwordReset";
import PasswordResetConfirmation from "./users/passwordResetConfirmation";
import SignUpConfirmation from "./signUp/signUpConfirmation";
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
        element: <SignIn />,
      },
      {
        path: getSignOutUrl(),
        element: <SignOut />,
      },
      {
        path: getSignUpUrl(),
        element: <SignUp />,
      },
      {
        path: getUsersUrl(),
        children: [
          {
            path: getSignUpConfirmationUrl(),
            element: <SignUpConfirmation />,
          },
          {
            path: getActivationUrl(),
            element: <Activation />,
          },
          {
            path: getResetPasswordUrl(),
            element: <PasswordReset />,
          },
          {
            path: getResetPasswordConfirmationUrl(),
            element: <PasswordResetConfirmation />,
          },
        ],
      },
    ],
  },
];

export default authenticationRoutes;
