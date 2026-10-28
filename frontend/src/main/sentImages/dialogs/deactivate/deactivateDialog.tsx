import { Button, DialogContent, Grid, DialogTitle, Typography, useMediaQuery, useTheme } from "@mui/material";
import AppDialog from '@/common/components/appDialog';
import { useAppDispatch, useAppSelector } from "@/store";
import { ISentImage } from "@/types";
import { closeDeactivateSendImageFrameDialog, getDialogs } from "@/store/ui/images/images.slice";
import { getApi, getSentImagesPaginated } from "@/store/entities/images/images.slice";
import { deactivateSentImage } from "@/store/entities/images/images.actions";
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";
import { getUser } from "@/store/entities/authentication/authentication.slice";
import { closePreviewSentImageDialog } from "@/store/ui/sentImages/sentImages.slice";

const SentImageDeactivateDialog = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const { deactivate: deactivateDialog } = useAppSelector(getDialogs);
    const sentImagesPaginated = useAppSelector(getSentImagesPaginated);
    const user = useAppSelector(getUser);
    const loading = useAppSelector(getApi).sending
    const sentImageToDeactivate = sentImagesPaginated.results.find((sentImage => sentImage.id === deactivateDialog.sentImageId)) as ISentImage | undefined;

    const matches = useMediaQuery(theme.breakpoints.up('sm'));

    const handleDialogClose = () => {
        dispatch(closeDeactivateSendImageFrameDialog());
    };

    const handleConfirmDeactivate = async () => {
        try {
            if (sentImageToDeactivate !== undefined) {
                await dispatch(deactivateSentImage(sentImageToDeactivate.id));
                dispatch(closePreviewSentImageDialog());
            }
        } catch {
            // cleanup happens in finally
        } finally {
            handleDialogClose();
        }
    };

    return (
        <AppDialog
            open={deactivateDialog.open}
            onClose={handleDialogClose}
            aria-describedby='deactivate-image-dialog'
            maxWidth="sm"
            fullWidth
            slots={{
                transition: matches ? ZoomTransition : SlideTransition
            }}
        >
            <DialogTitle>{"Gesendetes Foto wirklich deaktivieren?"}</DialogTitle>
            <DialogContent>
                <Typography sx={{ mb: 3 }}>{`Bei einer Deaktivierung wird das gesendete Foto umgehend von ${sentImageToDeactivate?.reciever === user.me.username ? "deinen" : `${sentImageToDeactivate?.reciever}s`} Bilderrahmen entfernt und dort nicht mehr angezeigt.`}</Typography>
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
        </AppDialog>
    );
};

export default SentImageDeactivateDialog;
