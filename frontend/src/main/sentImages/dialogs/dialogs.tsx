import React from 'react'
import ImagePreviewDialog from './preview/previewDialog'
import SentImageDeactivateDialog from './deactivate/deactivateDialog'
import SentImageScheduledActionDialog from './scheduledAction/scheduledActionDialog'
import FiltersDialog from './filters/filtersDialog'

const Dialogs: React.FC = () => {
  return (
    <>
      <ImagePreviewDialog />
      <SentImageDeactivateDialog />
      <SentImageScheduledActionDialog />
      <FiltersDialog />
    </>
  )
}

export default Dialogs
