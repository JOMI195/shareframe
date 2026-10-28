import { Button, Dialog, DialogContent, Grid, DialogTitle, Typography, useMediaQuery, useTheme, AppBar, Toolbar, IconButton } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { ISentImage } from "@/types";
import { closeScheduledSentImageDialog, getDialogs } from "@/store/ui/images/images.slice";
import { getApi, getSentImagesPaginated } from "@/store/entities/images/images.slice";
import { cancelScheduledSentImage, sendScheduledSentImageNow } from "@/store/entities/images/images.actions";
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";
import CloseIcon from '@mui/icons-material/Close';
import { getUser } from "@/store/entities/authentication/authentication.slice";
import { formatGermanDateTime } from "@/common/components/dateUtils";
import { closePreviewSentImageDialog } from "@/store/ui/sentImages/sentImages.slice";

const SentImageScheduledActionDialog = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const { scheduledAction: scheduledActionDialog } = useAppSelector(getDialogs);
    const sentImagesPaginated = useAppSelector(getSentImagesPaginated);
    const user = useAppSelector(getUser);
    const loading = useAppSelector(getApi).sending
    const sentImage = sentImagesPaginated.results.find((sentImage => sentImage.id === scheduledActionDialog.sentImageId)) as ISentImage | undefined;
    const isSendNow = scheduledActionDialog.action === 'sendNow';

    const matches = useMediaQuery(theme.breakpoints.up('sm'));

    const receiverFrames = sentImage?.reciever === user.me.username ? "deine" : `${sentImage?.reciever}s`;
    const scheduledFor = sentImage?.scheduled_for ? formatGermanDateTime(new Date(sentImage.scheduled_for)) : null;

    const texts = isSendNow ? {
        appBar: "Vorzeitig, sofort senden",
        title: "Geplantes Foto vorzeitig, sofort senden?",
        body: `Das Foto wird sofort ${scheduledFor ? `statt am ${scheduledFor} ` : ""}an ${receiverFrames} Bilderrahmen gesendet. Die gewählte Anzeigedauer bleibt erhalten.`,
        confirm: "Sofort senden bestätigen",
    } : {
        appBar: "Geplantes Senden abbrechen",
        title: "Geplantes Senden wirklich abbrechen?",
        body: `Das Foto wird ${scheduledFor ? `am ${scheduledFor} ` : ""}nicht an ${receiverFrames} Bilderrahmen gesendet.`,
        confirm: "Senden abbrechen bestätigen",
    };

    const handleDialogClose = () => {
        dispatch(closeScheduledSentImageDialog());
    };

    const handleConfirm = async () => {
        try {
            if (sentImage !== undefined) {
                await dispatch(isSendNow ? sendScheduledSentImageNow(sentImage.id) : cancelScheduledSentImage(sentImage.id));
                dispatch(closePreviewSentImageDialog());
            }
        } catch {
            // cleanup happens in finally
        } finally {
            handleDialogClose();
        }
    };

    return (
        <Dialog
            fullScreen={matches ? false : true}
            open={scheduledActionDialog.open}
            onClose={handleDialogClose}
            aria-describedby='scheduled-image-action-dialog'
            maxWidth="sm"
            fullWidth
            slots={{
                transition: matches ? ZoomTransition : SlideTransition
            }}
        >
            {!matches && (
                <AppBar sx={{ position: 'relative' }} color='inherit'>
                    <Toolbar>
                        <Typography sx={{ flex: 1 }} variant='h6' component='div'>
                            {texts.appBar}
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
            <DialogTitle>{texts.title}</DialogTitle>
            <DialogContent>
                <Typography sx={{ mb: 3 }}>{texts.body}</Typography>
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
                            Zurück
                        </Button>
                    </Grid>
                    <Grid
                        sx={{ order: { xs: 3, md: 3 } }}
                        size={{
                            xs: 12,
                            sm: 6
                        }}>
                        <Button
                            onClick={handleConfirm}
                            color={isSendNow ? "primary" : "error"}
                            disabled={loading}
                            variant="contained"
                            fullWidth
                        >
                            {texts.confirm}
                        </Button>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

export default SentImageScheduledActionDialog;
