import ConfirmDialog from '@/common/components/confirmDialog';
import { useAppDispatch, useAppSelector } from "@/store";
import { deleteFriendship } from "@/store/entities/friendships/friendships.actions";
import { closeDeleteFriendshipsDialog, getDialogs } from "@/store/ui/friendships/friendships.slice";
import { getApi, getFriendships } from "@/store/entities/friendships/friendships.slice";
import { getUser } from "@/store/entities/authentication/authentication.slice";
import { IFriendship } from "@/types";

const FriendshipDeleteDialog = () => {
    const dispatch = useAppDispatch();

    const { delete: deleteDialog } = useAppSelector(getDialogs);
    const friendships = useAppSelector(getFriendships);
    const user = useAppSelector(getUser);
    const loading = useAppSelector(getApi).loading
    const friendshipToDelete = friendships.find((friendship => friendship.id === deleteDialog.friendshipId)) as IFriendship | undefined;
    const friendToDelete = friendshipToDelete ? (friendshipToDelete.sender === user.me.username ? friendshipToDelete.reciever : friendshipToDelete.sender) : undefined;

    const handleDialogClose = () => {
        dispatch(closeDeleteFriendshipsDialog());
    };

    const handleConfirmDelete = async () => {
        try {
            if (friendshipToDelete !== undefined) dispatch(deleteFriendship(friendshipToDelete.id))
        } catch {
            // cleanup happens in finally
        } finally {
            handleDialogClose();
        }
    };

    return (
        <ConfirmDialog
            open={deleteDialog.open}
            title={`Freundschaft mit ${friendToDelete} wirklich beenden?`}
            confirmLabel="Beenden"
            destructive
            loading={loading}
            onConfirm={handleConfirmDelete}
            onCancel={handleDialogClose}
        >
            Die Freundschaft kann mit einer Freundschaftsanfrage jederzeit wieder hergestellt werden.
        </ConfirmDialog>
    );
};

export default FriendshipDeleteDialog;
