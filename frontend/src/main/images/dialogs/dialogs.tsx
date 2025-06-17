import React from 'react'
import UploadDialog from './upload/uploadDialog'
import ImagePreviewDialog from './preview/previewDialog'
import ImageDeleteDialog from './delete/deleteDialog'
import SendImageToUserFrameDialog from './sendImageToUserFrame/sendImageToUserFrameDialog'
import { useAppSelector } from '@/store'
import SelectionDialog from './selection/selectionDialog'
import { getDialogs } from '@/store/ui/images/images.slice'

const Dialogs: React.FC = () => {
  const selectionDialogOpen = useAppSelector(getDialogs).selection.open;

  return (
    <>
      <ImagePreviewDialog />
      <UploadDialog />
      <ImageDeleteDialog />
      <SendImageToUserFrameDialog />
      {selectionDialogOpen ? <SelectionDialog /> : null}
    </>
  )
}

export default Dialogs
