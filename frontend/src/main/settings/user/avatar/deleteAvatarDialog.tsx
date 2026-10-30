import ConfirmDialog from '@/common/components/confirmDialog';
import { useAppDispatch, useAppSelector } from "@/store";
import { getApi } from "@/store/entities/authentication/authentication.slice";
import { deleteMyAvatar } from "@/store/entities/authentication/authentication.actions";

interface DeleteAvatarDialogProps {
    open: boolean;
    onClose: () => void;
}

const DeleteAvatarDialog = ({ open, onClose }: DeleteAvatarDialogProps) => {
    const dispatch = useAppDispatch();
    const loading = useAppSelector(getApi).loading;

    const handleConfirmDelete = () => {
        dispatch(deleteMyAvatar());
        onClose();
    };

    return (
        <ConfirmDialog
            open={open}
            title="Profilbild wirklich entfernen?"
            confirmLabel="Profilbild entfernen"
            destructive
            loading={loading}
            onConfirm={handleConfirmDelete}
            onCancel={onClose}
        >
            Statt deinem Bild wird wieder dein Anfangsbuchstabe angezeigt. Du kannst jederzeit ein neues Bild hochladen.
        </ConfirmDialog>
    );
};

export default DeleteAvatarDialog;
