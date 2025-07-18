import { Box, Typography, useMediaQuery, useTheme, Chip, Grid } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { closePreviewImageDialog, getDialogs, openDeleteImageDialog, openSendImageToUserFrameDialog, selectImage } from "@/store/ui/images/images.slice";
import AuthenticatedImage from "@/common/components/authenticatedImage";
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { downloadImage } from "@/store/entities/images/images.actions";
import ShareframeMainDialog from "@/common/components/shareframeMainDialog";
import { DialogAction } from "@/types";
import { formatGermanDateTime } from "@/common/components/dateUtils";
import { getVariant } from "@/common/utils/images";

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;
const IMAGES_AUTO_DELETE_INTERVAL_HOURS = import.meta.env.VITE_APP_IMAGES_AUTO_DELETE_INTERVAL_HOURS
    ? +import.meta.env.VITE_APP_IMAGES_AUTO_DELETE_INTERVAL_HOURS
    : 24;

const ImagePreviewDialog = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const dialog = useAppSelector(getDialogs).preview;
    const selectedImage = dialog.selectedImage;

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const getDeletionTime = (createdAt: string) => {
        const createdDate = new Date(createdAt);
        const deletionDate = new Date(createdDate.getTime() + (IMAGES_AUTO_DELETE_INTERVAL_HOURS * 60 * 60 * 1000));
        return deletionDate;
    };

    const getTimeUntilDeletion = (createdAt: string) => {
        const now = new Date();
        const deletionTime = getDeletionTime(createdAt);
        const timeDiff = deletionTime.getTime() - now.getTime();

        if (timeDiff <= 0) return "Bereits abgelaufen. Wird gelöscht...";

        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `Wird in ${hours}h ${minutes}m gelöscht`;
        } else {
            return `Wird in ${minutes}m gelöscht`;
        }
    };

    const handleCloseImagePreview = () => {
        dispatch(closePreviewImageDialog());
    }

    const handleDelete = () => {
        if (selectedImage !== null) {
            dispatch(selectImage({ image: selectedImage, keepImageOnReSelect: true }));
            dispatch(openDeleteImageDialog());
        }
    };

    const handleSend = () => {
        if (selectedImage !== null) {
            dispatch(selectImage({ image: selectedImage, keepImageOnReSelect: true }));
            dispatch(openSendImageToUserFrameDialog());
        }
    };

    const handleDownloadFileButtonClick = () => {
        if (selectedImage !== null) {
            dispatch(downloadImage(`${MEDIA_BASE_URL}${selectedImage.url}`, selectedImage.name))
        }
    }

    const dialogActions: DialogAction[] = [
        {
            icon: <DownloadIcon />,
            onClick: handleDownloadFileButtonClick,
            label: 'Foto herunterladen'
        },
        {
            icon: <DeleteIcon />,
            onClick: handleDelete,
            label: 'Foto löschen',
            color: 'error'
        }
    ];

    const primaryAction: DialogAction = {
        icon: <SendIcon />,
        onClick: handleSend,
        label: 'Foto senden',
        color: 'primary',
    };

    return (
        <ShareframeMainDialog
            open={dialog.open}
            onDialogClose={handleCloseImagePreview}
            dialogTitle={"Hochgeladenes Foto"}
            dialogContentSx={{ padding: 2 }}
            actionsAdditional={dialogActions}
            actionPrimary={primaryAction}
            actionsShown={true}
        >
            <Box display="flex" flexDirection="column" alignItems="center">
                {selectedImage && (
                    <Grid container spacing={2} sx={{ pb: { xs: selectedImage.auto_delete_after_period ? 2 : 0, sm: 2 } }}>
                        <Grid item xs={12} sm={2}>
                            <Box sx={{ display: "flex", flexDirection: "column" }}>
                                <Typography sx={{ mb: 0.5 }} color="GrayText" >Hochgeladen am</Typography>
                                <Typography>{formatGermanDateTime(new Date(selectedImage.created_at))}</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            {selectedImage.auto_delete_after_period && (
                                <Box sx={{ display: "flex", flexDirection: "column" }}>
                                    <Typography sx={{ mb: 0.5 }} color="GrayText" >Verwendungszeit</Typography>
                                    <Chip
                                        icon={<AccessTimeIcon />}
                                        label={`Mit kurzer Verwendungszeit markiert. ${getTimeUntilDeletion(selectedImage.created_at)}`}
                                        color="warning"
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            maxWidth: '100%',
                                            height: 'auto',
                                            '& .MuiChip-label': {
                                                whiteSpace: 'normal',
                                                wordBreak: 'break-word',
                                                padding: '6px 8px',
                                                lineHeight: 1.2
                                            }
                                        }}
                                    />
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                )}

                {selectedImage && (
                    <AuthenticatedImage
                        url={`${MEDIA_BASE_URL}${isSmallScreen ? getVariant(selectedImage, "medium")?.url : getVariant(selectedImage, "large")?.url}`}
                        alt={selectedImage?.name}
                        style={{ maxWidth: "100%", maxHeight: "60vh", borderRadius: 8 }}
                    />
                )}

            </Box>
        </ShareframeMainDialog>
    );
};

export default ImagePreviewDialog;