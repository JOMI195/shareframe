export const getAuthenticationUrl = () => `/auth/`

export const getSignInUrl = () => `sign-in/`

export const getSignUpUrl = () => `sign-up/`

export const getSignUpConfirmationUrl = () => `sign-up-confirmation/`

export const getSignOutUrl = () => `sign-out/`

export const getUsersUrl = () => `users/`

export const getActivationUrl = () => `activate/:uid/:token`

export const getResetPasswordUrl = () => `password-reset/form/`

export const getResetPasswordConfirmationUrl = () =>
  `password-reset/:uid/:token`

export const getResetEmailUrl = () => `email-reset/:uid/:token`
