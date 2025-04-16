import { Box, useTheme, Typography, Stack, ListItemAvatar, Avatar, ListItemText, Grid, useMediaQuery } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { openDeactivateSendImageFrameDialog } from "@/store/ui/images/images.slice";
import AuthenticatedImage from "@/common/components/authenticatedImage";
import HideImageIcon from '@mui/icons-material/HideImage';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { formatGermanDateTime } from "@/common/components/dateUtils";
import { downloadImage } from "@/store/entities/images/images.actions";
import CustomDialog from "@/common/components/dialog";
import { DialogAction } from "@/types";
import { closePreviewSentImageDialog, getDialogs } from "@/store/ui/sentImages/sentImages.slice";
import { getVariant } from "@/common/utils/images";

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;

const ImagePreviewDialog = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const dialog = useAppSelector(getDialogs).preview;
    const selectedImage = dialog.selectedSentImage;
    const isExpired = (selectedImage && selectedImage.expires_at !== null) ? new Date(selectedImage.expires_at) < new Date() : true;

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const handleCloseImagePreview = () => {
        dispatch(closePreviewSentImageDialog());
    }

    const disableSentImageButtonClickHandle = () => {
        if (selectedImage !== null) {
            dispatch(openDeactivateSendImageFrameDialog({ sentImageId: selectedImage.id }))
        }
    }

    const handleDownloadFileButtonClick = () => {
        if (selectedImage !== null) {
            dispatch(downloadImage(`${MEDIA_BASE_URL}${selectedImage.image.url}`, selectedImage.image.name))
        }
    }

    const getStatusIcon = (isExpired: boolean) => {
        return isExpired ? (
            <VisibilityOffIcon sx={{ color: theme.palette.error.main, fontSize: '1rem' }} />
        ) : (
            <VisibilityIcon sx={{ color: theme.palette.success.main, fontSize: '1rem' }} />
        );
    };

    const dialogActions: DialogAction[] = [
        {
            icon: <DownloadIcon />,
            onClick: () => handleDownloadFileButtonClick(),
            label: 'Foto herunterladen'
        },
        {
            icon: <HideImageIcon />,
            onClick: () => disableSentImageButtonClickHandle(),
            disabled: isExpired,
            label: 'Foto deaktivieren',
            color: 'error'
        }
    ];

    return (
        <CustomDialog
            open={dialog.open}
            onClose={handleCloseImagePreview}
            title={"Gesendetes Foto"}
            //subtitle="Optional subtitle or description"
            actions={dialogActions}
            contentSx={{ padding: 2 }}
        >
            <Box display="flex" flexDirection="column" alignItems="center">
                {selectedImage && (
                    <Grid container spacing={2} sx={{ pb: 2 }}>
                        <Grid item xs={6} sm={2}>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                                <Typography sx={{ mb: 0.5 }} color="GrayText">Sender</Typography>
                                <Stack direction="row" spacing={-3}>
                                    <ListItemAvatar>
                                        <Avatar
                                            sx={{
                                                width: 24,
                                                height: 24,
                                                fontSize: 17
                                            }}
                                        >
                                            {selectedImage.sender?.toUpperCase().slice(0, 1)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={selectedImage.sender}
                                    />
                                </Stack>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                                <Typography sx={{ mb: 0.5 }} color="GrayText">Empfänger</Typography>
                                <Stack direction="row" spacing={-3}>
                                    <ListItemAvatar>
                                        <Avatar
                                            sx={{
                                                width: 24,
                                                height: 24,
                                                fontSize: 17
                                            }}
                                        >
                                            {selectedImage.reciever?.toUpperCase().slice(0, 1)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={selectedImage.reciever}
                                    />
                                </Stack>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                                <Typography sx={{ mb: 0.5 }} color="GrayText">Gesendet am</Typography>
                                <Typography>{(selectedImage && selectedImage.sent_at !== null) && formatGermanDateTime(new Date(selectedImage.sent_at))}</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                                <Typography sx={{ mb: 0.5 }} color="GrayText">Läuft ab am</Typography>
                                <Typography>{(selectedImage && selectedImage.expires_at !== null) && formatGermanDateTime(new Date(selectedImage.expires_at))}</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                                <Typography sx={{ mb: 0.5 }} color="GrayText">Status</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {getStatusIcon(isExpired)}
                                    <Typography>
                                        {isExpired ? 'Abgelaufen' : 'Aktiv'}
                                    </Typography>
                                </Box>
                            </Box>

                        </Grid>
                    </Grid>
                )}
                {selectedImage && (
                    <AuthenticatedImage
                        url={`${MEDIA_BASE_URL}${isSmallScreen ? getVariant(selectedImage.image, "medium")?.url : getVariant(selectedImage.image, "large")?.url}`}
                        alt={selectedImage.image.name}
                        style={{ maxWidth: "100%", maxHeight: "60vh", borderRadius: 8 }}
                    />
                )}

            </Box>
        </CustomDialog>
    );
};

export default ImagePreviewDialog;
