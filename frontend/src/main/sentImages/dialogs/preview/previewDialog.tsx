import { Box, useTheme, Typography, Stack, ListItemAvatar, ListItemText, Grid, useMediaQuery } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { openDeactivateSendImageFrameDialog, openScheduledSentImageDialog, ScheduledSentImageAction } from "@/store/ui/images/images.slice";
import AuthenticatedImage from "@/common/components/authenticatedImage";
import HideImageIcon from '@mui/icons-material/HideImage';
import DownloadIcon from '@mui/icons-material/Download';
import SendIcon from '@mui/icons-material/Send';
import CancelScheduleSendIcon from '@mui/icons-material/CancelScheduleSend';
import { formatGermanDateTime } from "@/common/components/dateUtils";
import { downloadImage } from "@/store/entities/images/images.actions";
import ShareframeMainDialog from "@/common/components/shareframeMainDialog";
import { DialogAction } from "@/types";
import { closePreviewSentImageDialog, getDialogs } from "@/store/ui/sentImages/sentImages.slice";
import { getVariant } from "@/common/utils/images";
import { formatDuration, getActiveDurationMs, getSentImageState } from "../../sentImageStatus";
import SentImageStatusLabel from "../../sentImageStatusLabel";
import UserAvatar from "@/common/components/userAvatar";

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;

const ImagePreviewDialog = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const dialog = useAppSelector(getDialogs).preview;
    const selectedImage = dialog.selectedSentImage;
    const state = selectedImage ? getSentImageState(selectedImage) : 'expired';
    const isScheduled = state === 'scheduled';
    const activeDurationMs = selectedImage ? getActiveDurationMs(selectedImage) : null;

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const handleCloseImagePreview = () => {
        dispatch(closePreviewSentImageDialog());
    }

    const disableSentImageButtonClickHandle = () => {
        if (selectedImage !== null) {
            dispatch(openDeactivateSendImageFrameDialog({ sentImageId: selectedImage.id }))
        }
    }

    const openScheduledActionDialog = (action: ScheduledSentImageAction) => {
        if (selectedImage !== null) {
            dispatch(openScheduledSentImageDialog({ sentImageId: selectedImage.id, action }))
        }
    }

    const handleDownloadFileButtonClick = () => {
        if (selectedImage !== null) {
            dispatch(downloadImage(`${MEDIA_BASE_URL}${selectedImage.image.url}`, selectedImage.image.name))
        }
    }

    const dialogActions: DialogAction[] = isScheduled ? [
        {
            icon: <SendIcon />,
            onClick: () => openScheduledActionDialog('sendNow'),
            label: 'Vorzeitig, sofort senden',
            color: 'primary'
        },
        {
            icon: <CancelScheduleSendIcon />,
            onClick: () => openScheduledActionDialog('cancel'),
            label: 'Geplantes Senden abbrechen',
            color: 'error'
        }
    ] : state === 'active' ? [
        {
            icon: <HideImageIcon />,
            onClick: disableSentImageButtonClickHandle,
            label: 'Foto deaktivieren',
            color: 'error'
        }
    ] : [];

    const primaryAction: DialogAction = {
        icon: <DownloadIcon />,
        onClick: handleDownloadFileButtonClick,
        label: 'Foto herunterladen',
        color: 'primary',
    };

    return (
        <ShareframeMainDialog
            open={dialog.open}
            onDialogClose={handleCloseImagePreview}
            dialogTitle={"Gesendetes Foto"}
            dialogContentSx={{ padding: 2 }}
            //subtitle="Optional subtitle or description"
            actionsAdditional={dialogActions}
            actionPrimary={primaryAction}
            actionsShown={true}
        >
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center"
                }}>
                {selectedImage && (
                    <Grid container spacing={2} sx={{ pb: 2 }}>
                        <Grid
                            size={{
                                xs: 6,
                                sm: 4,
                                md: 2
                            }}>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                                <Typography sx={{ mb: 0.5 }} color="GrayText">Sender</Typography>
                                <Stack direction="row" spacing={-1.5} sx={{ alignItems: "center" }}>
                                    <ListItemAvatar>
                                        <UserAvatar
                                            username={selectedImage.sender}
                                            url={selectedImage.sender_avatar}
                                            size={36}
                                        />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={selectedImage.sender}
                                    />
                                </Stack>
                            </Box>
                        </Grid>
                        <Grid
                            size={{
                                xs: 6,
                                sm: 4,
                                md: 2
                            }}>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                                <Typography sx={{ mb: 0.5 }} color="GrayText">Empfänger</Typography>
                                <Stack direction="row" spacing={-1.5} sx={{ alignItems: "center" }}>
                                    <ListItemAvatar>
                                        <UserAvatar
                                            username={selectedImage.reciever}
                                            url={selectedImage.reciever_avatar}
                                            size={36}
                                        />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={selectedImage.reciever}
                                    />
                                </Stack>
                            </Box>
                        </Grid>
                        <Grid
                            size={{
                                xs: 6,
                                sm: 4,
                                md: 2
                            }}>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                                <Typography sx={{ mb: 0.5 }} color="GrayText">{isScheduled ? "Geplant für" : "Gesendet am"}</Typography>
                                <Typography>{formatGermanDateTime(new Date(isScheduled && selectedImage.scheduled_for ? selectedImage.scheduled_for : selectedImage.sent_at))}</Typography>
                            </Box>
                        </Grid>
                        <Grid
                            size={{
                                xs: 6,
                                sm: 4,
                                md: 2
                            }}>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                                <Typography sx={{ mb: 0.5 }} color="GrayText">Läuft ab am</Typography>
                                <Typography>{(selectedImage && selectedImage.expires_at !== null) && formatGermanDateTime(new Date(selectedImage.expires_at))}</Typography>
                            </Box>
                        </Grid>
                        <Grid
                            size={{
                                xs: 6,
                                sm: 4,
                                md: 2
                            }}>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                                <Typography sx={{ mb: 0.5 }} color="GrayText">Anzeigedauer</Typography>
                                <Typography>{activeDurationMs !== null ? formatDuration(activeDurationMs) : "–"}</Typography>
                            </Box>
                        </Grid>
                        <Grid
                            size={{
                                xs: 6,
                                sm: 4,
                                md: 2
                            }}>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                                <Typography sx={{ mb: 0.5 }} color="GrayText">Status</Typography>
                                <SentImageStatusLabel state={state} />
                            </Box>

                        </Grid>
                    </Grid>
                )}
                {selectedImage && (
                    <AuthenticatedImage
                        url={`${MEDIA_BASE_URL}${isSmallScreen ? getVariant(selectedImage.image, "medium")?.url : getVariant(selectedImage.image, "large")?.url}`}
                        alt={selectedImage.image.name}
                        style={{ maxWidth: "100%", maxHeight: "60vh", borderRadius: 8 }}
                        aspectRatio={selectedImage.image.height ? selectedImage.image.width / selectedImage.image.height : undefined}
                    />
                )}

            </Box>
        </ShareframeMainDialog>
    );
};

export default ImagePreviewDialog;
