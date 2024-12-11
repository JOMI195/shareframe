import * as userSlice from "./authentication.slice";
import * as authEndpoints from "@/assets/endpoints/api/authEndpoints";
import * as accountEndpoints from "@/assets/endpoints/api/accountsEndpoints";
import { apiRequest } from "@/common/utils/constants/api.constants";
import { IPatchUserForm } from "@/types";

export const signUpUser = (userData: {
  username: string;
  email: string;
  password: string;
  re_password: string;
}) =>
  apiRequest({
    url: authEndpoints.getUserListUrl(),
    method: "post",
    data: userData,
    onStart: userSlice.userCreationPending.type,
    onSuccess: userSlice.userCreationFulfilled.type,
    onError: userSlice.userCreationRejected.type,
  });

export const resendActivationEmail = (email: string) =>
  apiRequest({
    url: authEndpoints.getUserActivationResendUrl(),
    method: "post",
    onStart: userSlice.resendActivationEmailPending.type,
    onSuccess: userSlice.resendActivationEmailFulfilled.type,
    onError: userSlice.resendActivationEmailRejected.type,
    data: { email: email },
  });

export const signOutUser = () => ({
  type: userSlice.signedOut.type,
});

export const authenticateUser = (userData: {
  email: string;
  password: string;
}) =>
  apiRequest({
    url: authEndpoints.getTokenCreateUrl(),
    method: "post",
    data: userData,
    onStart: userSlice.authenticationPending.type,
    onSuccess: userSlice.authenticationFulfilled.type,
    onError: userSlice.authenticationRejected.type,
  });

export const activateUser = (activationData: { uid: string; token: string }) =>
  apiRequest({
    url: authEndpoints.getUserActivationUrl(),
    method: "post",
    data: activationData,
    onStart: userSlice.userActivationPending.type,
    onSuccess: userSlice.userActivationFulfilled.type,
    onError: userSlice.userActivationRejected.type,
  });

export const refreshToken = (token: string) =>
  apiRequest({
    url: authEndpoints.getTokenRefreshUrl(),
    method: "post",
    data: { refresh: token },
    onSuccess: userSlice.authenticationFulfilled.type,
  });

export const setPassword = (passwords: {
  current_password: string;
  new_password: string;
  re_new_password: string;
}) =>
  apiRequest({
    url: authEndpoints.getSetPasswordUrl(),
    method: "post",
    onStart: userSlice.passwordUpdatePending.type,
    onSuccess: userSlice.passwordUpdateFulfilled.type,
    onError: userSlice.passwordUpdateRejected.type,
    data: passwords,
  });

export const setUsername = (usernameData: {
  current_password: string;
  new_username: string;
}) =>
  apiRequest({
    url: authEndpoints.getSetUsernameUrl(),
    method: "post",
    onStart: userSlice.usernameUpdatePending.type,
    onSuccess: userSlice.usernameUpdateFulfilled.type,
    onError: userSlice.usernameUpdateRejected.type,
    onSuccessPayload: usernameData.new_username,
    data: usernameData,
  });

export const resetPassword = (email: { email: string }) =>
  apiRequest({
    url: authEndpoints.getResetPasswordUrl(),
    onStart: userSlice.passwordResetPending.type,
    onSuccess: userSlice.passwordResetFulfilled.type,
    onError: userSlice.passwordResetRejected.type,
    method: "post",
    data: email,
  });

export const resetPasswordConfirm = (confirmationData: {
  uid: string;
  token: string;
  new_password: string;
  re_new_password: string;
}) =>
  apiRequest({
    url: authEndpoints.getResetPasswordConfirmUrl(),
    onStart: userSlice.passwordUpdatePending.type,
    onSuccess: userSlice.passwordUpdateFulfilled.type,
    onError: userSlice.passwordUpdateRejected.type,
    method: "post",
    data: confirmationData,
  });

export const setEmail = (email: {
  current_password: string;
  new_email: string;
}) =>
  apiRequest({
    url: authEndpoints.getSetEmailUrl(),
    method: "post",
    onStart: userSlice.emailUpdatePending.type,
    onSuccess: userSlice.emailUpdateFulfilled.type,
    onSuccessPayload: email.new_email,
    onError: userSlice.emailUpdateRejected.type,
    data: email,
  });

export const loadMyUserProfile = () =>
  apiRequest({
    url: authEndpoints.getMyUserDataUrl(),
    onStart: userSlice.getUserDataPending.type,
    onSuccess: userSlice.getUserDataFulfilled.type,
    onError: userSlice.getUserDataRejected.type,
  });

export const deleteMyUserProfile = (
  password: string,
  anonymize: boolean = true
) =>
  apiRequest({
    url: authEndpoints.getMyUserDataUrl(),
    onStart: userSlice.userDeletePending.type,
    onSuccess: userSlice.userDeleteFulfilled.type,
    onError: userSlice.userDeleteRejected.type,
    method: "delete",
    data: { password: password, anonymize: anonymize }
  });

export const updateMyUserData = (user: IPatchUserForm
) =>
  apiRequest({
    url: authEndpoints.getMyUserDataUrl(),
    onStart: userSlice.userUpdatePending.type,
    onSuccess: userSlice.userUpdateFulfilled.type,
    onError: userSlice.userUpdateRejected.type,
    method: "patch",
    data: user,
  });

export const updateMyAccount = (account: any) =>
  apiRequest({
    url: accountEndpoints.getMyAccountUrl(),
    onStart: userSlice.accountUpdatePending.type,
    onSuccess: userSlice.accountUpdateFulfilled.type,
    onError: userSlice.accountUpdateRejected.type,
    method: "patch",
    data: account,
  });
