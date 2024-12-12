import React from 'react'
import FriendshipCreateDialog from './create/createDialog'
import FriendshipDeleteDialog from './delete/deleteDialog'

const Dialogs: React.FC = () => {
  return (
    <>
      <FriendshipCreateDialog />
      <FriendshipDeleteDialog />
    </>
  )
}

export default Dialogs
