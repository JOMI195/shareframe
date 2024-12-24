import React from 'react'
import ImagePreviewDialog from './preview/previewDialog'
import SentImageDeactivateDialog from './deactivate/deactivateDialog'

const Dialogs: React.FC = () => {
  return (
    <>
      <ImagePreviewDialog />
      <SentImageDeactivateDialog />
    </>
  )
}

export default Dialogs
