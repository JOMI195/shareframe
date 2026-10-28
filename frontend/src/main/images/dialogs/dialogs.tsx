import React, { lazy, Suspense, useState } from 'react'
import ImagePreviewDialog from './preview/previewDialog'
import ImageDeleteDialog from './delete/deleteDialog'
import { useAppSelector } from '@/store'
import SelectionDialog from './selection/selectionDialog'
import { getDialogs } from '@/store/ui/images/images.slice'

// Separate chunks; the scheduler mounts on first open and stays for the close animation.
// The upload dialog always mounts: it picks up photos shared into the app.
const UploadDialog = lazy(() => import('./upload/uploadDialog'))
const SendImageToUserFrameDialog = lazy(() => import('./sendImageToUserFrame/sendImageToUserFrameDialog'))

const Dialogs: React.FC = () => {
  const dialogs = useAppSelector(getDialogs);
  const [sendOpened, setSendOpened] = useState(false);

  if (dialogs.sendToFrame.open && !sendOpened) setSendOpened(true);

  return (
    <>
      <ImagePreviewDialog />
      <Suspense fallback={null}>
        <UploadDialog />
        {sendOpened ? <SendImageToUserFrameDialog /> : null}
      </Suspense>
      <ImageDeleteDialog />
      {dialogs.selection.open ? <SelectionDialog /> : null}
    </>
  )
}

export default Dialogs
