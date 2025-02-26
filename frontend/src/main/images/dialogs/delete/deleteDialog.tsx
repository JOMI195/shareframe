import { Button, Dialog, DialogContent, Grid, DialogTitle, Typography, useMediaQuery, useTheme, AppBar, Toolbar, IconButton, Alert } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { IImage, isIImage } from "@/types";
import { closeDeleteImageDialog, closePreviewImageDialog, getDialogs } from "@/store/ui/images/images.slice";
import { getApi, getImagesPaginated } from "@/store/entities/images/images.slice";
import { deleteImage } from "@/store/entities/images/images.actions";
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";
import CloseIcon from '@mui/icons-material/Close';
import { useEffect, useState } from "react";

const ImageDeleteDialog = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const { delete: deleteDialog } = useAppSelector(getDialogs);
    const imagesPaginated = useAppSelector(getImagesPaginated);
    const loading = useAppSelector(getApi).loading
    const imageToDelete = imagesPaginated.results.find((image => image.id === deleteDialog.imageId)) as IImage | undefined;

    const [errorMessage, setErrorMessage] = useState("");

    const matches = useMediaQuery(theme.breakpoints.up('sm'));

    const handleDialogClose = () => {
        dispatch(closeDeleteImageDialog());
    };

    const handleConfirmDelete = async () => {
        if (imageToDelete !== undefined) {
            const deletedImage = await dispatch(deleteImage(imageToDelete.id, imageToDelete.name));
            console.log(deletedImage);
            if (!isIImage(deletedImage)) {
                setErrorMessage("Ein Fehler ist aufgetreten. Möglicherweise existiert eine Aktivität mit diesem Bild. Nachdem diese Aktivtät abgelaufen und nach 14 Tagen gelöscht wurde, kann dieses Bild entfernt werden. Bitte warte einige Tage und versuche es erneut.");
            } else {
                setErrorMessage("");
                handleDialogClose();
                dispatch(closePreviewImageDialog());
            }
        } else {
            setErrorMessage("Ein unerwarteter Fehler ist aufgetreten. Bitte logge dich aus und wieder ein und versuche es ernuet.");
        }
    };

    useEffect(() => {
        let timer: NodeJS.Timeout | undefined;

        if (errorMessage) {
            timer = setTimeout(() => {
                setErrorMessage("");
            }, 60000);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [errorMessage]);

    return (
        <Dialog
            fullScreen={matches ? false : true}
            open={deleteDialog.open}
            TransitionComponent={matches ? ZoomTransition : SlideTransition}
            onClose={handleDialogClose}
            aria-describedby='dedlete-image-dialog'
            maxWidth="sm"
            fullWidth
        >
            {!matches && (
                <AppBar sx={{ position: 'relative' }} color='inherit'>
                    <Toolbar>
                        <Typography sx={{ flex: 1 }} variant='h6' component='div'>
                            Foto löschen
                        </Typography>
                        <IconButton
                            edge='start'
                            color='inherit'
                            onClick={handleDialogClose}
                            aria-label='cancel'
                        >
                            <CloseIcon />
                        </IconButton>
                    </Toolbar>
                </AppBar>
            )}
            <DialogTitle>{`Foto ${imageToDelete?.name} wirklich löschen?`}</DialogTitle>
            <DialogContent>
                <Typography sx={{ mb: 3 }}>Das Löschen des Fotos ist unwiderruflich. Es kann nicht wieder hergestellt werden.</Typography>
                {errorMessage && (
                    <Alert severity="error" sx={{ my: 2 }}>
                        {errorMessage}
                    </Alert>
                )}
                <Grid
                    container
                    display={"flex"} justifyContent={"space-between"} alignItems={"center"}
                    spacing={2}
                >
                    <Grid item xs={12} sm={6} sx={{ order: { xs: 4, md: 3 } }}>
                        <Button
                            onClick={handleDialogClose}
                            color="primary"
                            variant="outlined"
                            fullWidth
                        >
                            Abbrechen
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ order: { xs: 3, md: 3 } }}>
                        <Button
                            onClick={handleConfirmDelete}
                            color="error"
                            disabled={loading}
                            variant="contained"
                            fullWidth
                        >
                            {"Löschen bestätigen"}
                        </Button>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

export default ImageDeleteDialog;
