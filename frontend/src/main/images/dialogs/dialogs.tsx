import React, { lazy, Suspense, useState } from 'react'
import ImagePreviewDialog from './preview/previewDialog'
import ImageDeleteDialog from './delete/deleteDialog'
import { useAppSelector } from '@/store'
import SelectionDialog from './selection/selectionDialog'
import { getDialogs } from '@/store/ui/images/images.slice'

// The editor and the scheduler bring heavy dependencies; they load on first open and stay mounted for the close animation.
const UploadDialog = lazy(() => import('./upload/uploadDialog'))
const SendImageToUserFrameDialog = lazy(() => import('./sendImageToUserFrame/sendImageToUserFrameDialog'))

const Dialogs: React.FC = () => {
  const dialogs = useAppSelector(getDialogs);
  const [uploadOpened, setUploadOpened] = useState(false);
  const [sendOpened, setSendOpened] = useState(false);

  if (dialogs.create.open && !uploadOpened) setUploadOpened(true);
  if (dialogs.sendToFrame.open && !sendOpened) setSendOpened(true);

  return (
    <>
      <ImagePreviewDialog />
      <Suspense fallback={null}>
        {uploadOpened ? <UploadDialog /> : null}
        {sendOpened ? <SendImageToUserFrameDialog /> : null}
      </Suspense>
      <ImageDeleteDialog />
      {dialogs.selection.open ? <SelectionDialog /> : null}
    </>
  )
}

export default Dialogs
