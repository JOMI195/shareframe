import ConfirmDialog from '@/common/components/confirmDialog';
import { useAppDispatch, useAppSelector } from "@/store";
import { closeDeleteImageDialog, closePreviewImageDialog, closeSelectionDialog, getDialogs, openImagesAlertSnackbar } from "@/store/ui/images/images.slice";
import { getApi as imagesApi } from "@/store/entities/images/images.slice";
import { deleteImage } from "@/store/entities/images/images.actions";

const ImageDeleteDialog = () => {
    const dispatch = useAppDispatch();

    const { delete: deleteDialog } = useAppSelector(getDialogs);
    const loading = useAppSelector(imagesApi).sending
    const imagesToDelete = deleteDialog.imagesToDelete;

    const handleDialogClose = () => {
        dispatch(closeDeleteImageDialog());
    };

    const handleConfirmDelete = async () => {
        const results = await Promise.all(imagesToDelete.map(image => dispatch(deleteImage(image.id, image.name))));
        // The api middleware resolves a failed request with its error message.
        const failed = results.filter(result => typeof result === 'string').length;
        const deleted = results.length - failed;

        // One outcome for the whole selection instead of a snackbar per photo.
        dispatch(openImagesAlertSnackbar(
            failed === 0
                ? { message: `${deleted} ${deleted === 1 ? "Foto" : "Fotos"} gelöscht`, severity: "success" }
                : { message: `${deleted} von ${results.length} Fotos gelöscht, ${failed} fehlgeschlagen`, severity: deleted === 0 ? "error" : "warning" }
        ));
        handleDialogClose();
        dispatch(closePreviewImageDialog());
        dispatch(closeSelectionDialog());
    };

    return (
        <ConfirmDialog
            open={deleteDialog.open}
            title={`Ausgewählte${imagesToDelete.length === 1 ? "s" : ""} Foto${imagesToDelete.length > 1 ? "s" : ""} wirklich löschen?`}
            confirmLabel="Löschen"
            destructive
            loading={loading}
            confirmDisabled={imagesToDelete.length === 0}
            onConfirm={handleConfirmDelete}
            onCancel={handleDialogClose}
        >
            {`${imagesToDelete.length > 1 ? "Die Fotos werden" : "Das Foto wird"} aus deiner Galerie entfernt und kann nicht wiederhergestellt werden. Bereits gesendete Fotos bleiben auf den Rahmen und in deinen Aktivitäten, bis sie ablaufen, und werden 14 Tage danach endgültig gelöscht. Geplante Sendungen ${imagesToDelete.length > 1 ? "dieser Fotos" : "dieses Fotos"} werden abgebrochen.`}
        </ConfirmDialog>
    );
};

export default ImageDeleteDialog;
