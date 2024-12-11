export const getTokenCreateUrl = () => `auth/jwt/create/`

export const getTokenRefreshUrl = () => `auth/jwt/refresh/`

export const getTokenVerifyUrl = () => `auth/jwt/verify/`

export const getUserListUrl = () => `auth/users/`

export const getUserItemUrl = (userId: number) => `auth/users/${userId}/`

export const getMyUserDataUrl = () => `auth/users/me/`

export const getUserActivationUrl = () => `auth/users/activation/`

export const getUserActivationResendUrl = () => `auth/users/resend_activation/`

export const getSetPasswordUrl = () => `auth/users/set_password/`

export const getResetPasswordUrl = () => `auth/users/reset_password/`

export const getResetPasswordConfirmUrl = () =>
  `auth/users/reset_password_confirm/`

export const getSetEmailUrl = () => `auth/users/set_email/`

export const getSetUsernameUrl = () => `auth/users/set_username/`
