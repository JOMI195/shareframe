export const getFramesUrl = () => "frames/"

export const getRegisterFrameUrl = () => `${getFramesUrl()}register-user/`

export const getUnregisterFrameUrl = () => `${getFramesUrl()}unregister-user/`

export const getSentImageToFrameUrl = () => `${getFramesUrl()}send-image/`

export const getObtainFrameOtpUrl = (id: number) => `${getFramesUrl()}${id}/obtain-frame-otp/`