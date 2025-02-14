import React from 'react'
import ImagePreviewDialog from './preview/previewDialog'
import SentImageDeactivateDialog from './deactivate/deactivateDialog'
import FiltersDialog from './filters/filtersDialog'

const Dialogs: React.FC = () => {
  return (
    <>
      <ImagePreviewDialog />
      <SentImageDeactivateDialog />
      <FiltersDialog />
    </>
  )
}

export default Dialogs
