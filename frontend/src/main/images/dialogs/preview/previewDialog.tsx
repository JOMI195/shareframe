import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { closePreviewImageDialog, getDialogs, openDeleteImageDialog, openSendImageToUserFrameDialog } from "@/store/ui/images/images.slice";
import AuthenticatedImage from "@/common/components/authenticatedImage";
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import { downloadImage } from "@/store/entities/images/images.actions";
import ShareframeMainDialog from "@/common/components/shareframeMainDialog";
import { DialogAction } from "@/types";
import { formatGermanDateTime } from "@/common/components/dateUtils";
import { getVariant } from "@/common/utils/images";

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;

const ImagePreviewDialog = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const dialog = useAppSelector(getDialogs).preview;
    const selectedImage = dialog.selectedImage;

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const handleCloseImagePreview = () => {
        dispatch(closePreviewImageDialog());
    }

    const handleDelete = () => {
        if (selectedImage !== null) {
            dispatch(openDeleteImageDialog({ imageId: selectedImage.id }));
        }
    };

    const handleSend = () => {
        if (selectedImage !== null) {
            dispatch(openSendImageToUserFrameDialog({ imageId: selectedImage.id }));
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
            dialogTitle={selectedImage?.display_name ?? selectedImage?.name}
            dialogContentSx={{ padding: 2 }}
            actionsSecondary={dialogActions}
            actionPrimary={primaryAction}
            actionsShown={true}
        >
            <Box display="flex" flexDirection="column" alignItems="flex-start">
                {selectedImage && (
                    <Box sx={{ display: "flex", flexDirection: "row", pb: 2 }}>
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Typography sx={{ mb: 0.5 }} color="GrayText" >Hochgeladen am</Typography>
                            <Typography>{formatGermanDateTime(new Date(selectedImage.created_at))}</Typography>
                        </Box>
                    </Box>
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
