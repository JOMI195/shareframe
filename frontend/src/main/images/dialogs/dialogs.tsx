import React from 'react'
import UploadDialog from './upload/uploadDialog'
import ImagePreviewDialog from './preview/previewDialog'
import ImageDeleteDialog from './delete/deleteDialog'
import SendImageToUserFrameDialog from './sendImageToUserFrame/sendImageToUserFrameDialog'

const Dialogs: React.FC = () => {
  return (
    <>
      <ImagePreviewDialog />
      <UploadDialog />
      <ImageDeleteDialog />
      <SendImageToUserFrameDialog />
    </>
  )
}

export default Dialogs
