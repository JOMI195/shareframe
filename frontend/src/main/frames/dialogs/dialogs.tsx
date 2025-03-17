import React from 'react'
import RegisterFrameDialog from './register/registerDialog'
import UnregisterFrameDialog from './unregister/unregisterDialog'
import RequestOTPDialog from './requestOTP/requestOTPDialog'

const Dialogs: React.FC = () => {
  return (
    <>
      <RegisterFrameDialog />
      <UnregisterFrameDialog />
      <RequestOTPDialog />
    </>
  )
}

export default Dialogs
