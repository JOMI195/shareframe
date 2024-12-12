import React from 'react'
import RegisterFrameDialog from './register/registerDialog'
import UnregisterFrameDialog from './unregister/unregisterDialog'

const Dialogs: React.FC = () => {
  return (
    <>
      <RegisterFrameDialog />
      <UnregisterFrameDialog />
    </>
  )
}

export default Dialogs
