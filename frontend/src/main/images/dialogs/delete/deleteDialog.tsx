import { Button, DialogContent, Grid, DialogTitle, Typography, useMediaQuery, useTheme } from "@mui/material";
import AppDialog from '@/common/components/appDialog';
import { useAppDispatch, useAppSelector } from "@/store";
import { closeDeleteImageDialog, closePreviewImageDialog, closeSelectionDialog, getDialogs, openImagesAlertSnackbar } from "@/store/ui/images/images.slice";
import { getApi as imagesApi } from "@/store/entities/images/images.slice";
import { deleteImage } from "@/store/entities/images/images.actions";
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";

const ImageDeleteDialog = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const { delete: deleteDialog } = useAppSelector(getDialogs);
    const loading = useAppSelector(imagesApi).sending
    const imagesToDelete = deleteDialog.imagesToDelete;

    const matches = useMediaQuery(theme.breakpoints.up('sm'));

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
        <AppDialog
            open={deleteDialog.open}
            onClose={handleDialogClose}
            aria-describedby='dedlete-image-dialog'
            maxWidth="sm"
            fullWidth
            slots={{
                transition: matches ? ZoomTransition : SlideTransition
            }}
        >
            <DialogTitle>{`Ausgewählte${imagesToDelete.length === 1 ? "s" : ""} Foto${imagesToDelete.length > 1 ? "s" : ""} wirklich löschen?`}</DialogTitle>
            <DialogContent>
                <Typography sx={{ mb: 3 }}>{`Das Löschen von Fotos ist unwiderruflich. Sie können nicht wieder hergestellt werden und müssen erneut hochgeladen werden. Geplante Sendungen ${imagesToDelete.length > 1 ? "dieser Fotos" : "dieses Fotos"} werden abgebrochen und nicht mehr gesendet.`}</Typography>
                <Grid
                    container
                    spacing={2}
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                    <Grid
                        sx={{ order: { xs: 4, md: 3 } }}
                        size={{
                            xs: 12,
                            sm: 6
                        }}>
                        <Button
                            onClick={handleDialogClose}
                            color="primary"
                            variant="outlined"
                            fullWidth
                        >
                            Abbrechen
                        </Button>
                    </Grid>
                    <Grid
                        sx={{ order: { xs: 3, md: 3 } }}
                        size={{
                            xs: 12,
                            sm: 6
                        }}>
                        <Button
                            onClick={handleConfirmDelete}
                            color="error"
                            disabled={loading || imagesToDelete.length === 0}
                            variant="contained"
                            fullWidth
                        >
                            {"Löschen bestätigen"}
                        </Button>
                    </Grid>
                </Grid>
            </DialogContent>
        </AppDialog>
    );
};

export default ImageDeleteDialog;
