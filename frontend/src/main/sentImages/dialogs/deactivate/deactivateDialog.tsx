import { Button, Dialog, DialogContent, Grid, DialogTitle, Typography, useMediaQuery, useTheme, AppBar, Toolbar, IconButton } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { ISentImage } from "@/types";
import { closeDeactivateSendImageFrameDialog, closePreviewImageDialog, getDialogs } from "@/store/ui/images/images.slice";
import { getApi, getSentImages } from "@/store/entities/images/images.slice";
import { deactivateSentImage } from "@/store/entities/images/images.actions";
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";
import CloseIcon from '@mui/icons-material/Close';
import { getUser } from "@/store/entities/authentication/authentication.slice";

const SentImageDeactivateDialog = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const { deactivate: deactivateDialog } = useAppSelector(getDialogs);
    const sentImages = useAppSelector(getSentImages);
    const user = useAppSelector(getUser);
    const loading = useAppSelector(getApi).loading
    const sentImageToDeactivate = sentImages.find((sentImage => sentImage.id === deactivateDialog.sentImageId)) as ISentImage | undefined;

    const matches = useMediaQuery(theme.breakpoints.up('sm'));

    const handleDialogClose = () => {
        dispatch(closeDeactivateSendImageFrameDialog());
    };

    const handleConfirmDeactivate = async () => {
        try {
            if (sentImageToDeactivate !== undefined) {
                await dispatch(deactivateSentImage(sentImageToDeactivate.id));
                dispatch(closePreviewImageDialog());
            }
        } catch (error) {
        } finally {
            handleDialogClose();
        }
    };

    return (
        <Dialog
            fullScreen={matches ? false : true}
            open={deactivateDialog.open}
            TransitionComponent={matches ? ZoomTransition : SlideTransition}
            onClose={handleDialogClose}
            aria-describedby='deactivate-image-dialog'
            maxWidth="sm"
            fullWidth
        >
            {!matches && (
                <AppBar sx={{ position: 'relative' }} color='inherit'>
                    <Toolbar>
                        <Typography sx={{ flex: 1 }} variant='h6' component='div'>
                            Foto deaktivieren
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
            <DialogTitle>{"Gesendetes Foto wirklich deaktivieren?"}</DialogTitle>
            <DialogContent>
                <Typography sx={{ mb: 3 }}>{`Bei einer Deaktivierung wird das gesendete Foto umgehend von ${sentImageToDeactivate?.reciever === user.me.username ? "deinen" : `${sentImageToDeactivate?.reciever}s`} Bilderrahmen entfernt und dort nicht mehr angezeigt.`}</Typography>
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
                            onClick={handleConfirmDeactivate}
                            color="error"
                            disabled={loading}
                            variant="contained"
                            fullWidth
                        >
                            {"Deaktivieren bestätigen"}
                        </Button>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

export default SentImageDeactivateDialog;
