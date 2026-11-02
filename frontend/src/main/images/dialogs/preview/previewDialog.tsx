import { Typography, Chip } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { closePreviewImageDialog, getDialogs, openDeleteImageDialog, openSendImageToUserFrameDialog, selectImage } from "@/store/ui/images/images.slice";
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { downloadImage } from "@/store/entities/images/images.actions";
import ShareframeMainDialog from "@/common/components/shareframeMainDialog";
import { DialogAction } from "@/types";
import { formatGermanDateTime } from "@/common/components/dateUtils";
import PreviewImage from "./previewImage";
import { PreviewField } from "./previewLayout";

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;
const IMAGES_AUTO_DELETE_INTERVAL_HOURS = import.meta.env.VITE_APP_IMAGES_AUTO_DELETE_INTERVAL_HOURS
    ? +import.meta.env.VITE_APP_IMAGES_AUTO_DELETE_INTERVAL_HOURS
    : 24;

const ImagePreviewDialog = () => {
    const dispatch = useAppDispatch();

    const dialog = useAppSelector(getDialogs).preview;
    const selectedImage = dialog.selectedImage;

    const getDeletionTime = (createdAt: string) => {
        const createdDate = new Date(createdAt);
        const deletionDate = new Date(createdDate.getTime() + (IMAGES_AUTO_DELETE_INTERVAL_HOURS * 60 * 60 * 1000));
        return deletionDate;
    };

    const getTimeUntilDeletion = (createdAt: string) => {
        const now = new Date();
        const deletionTime = getDeletionTime(createdAt);
        const timeDiff = deletionTime.getTime() - now.getTime();

        if (timeDiff <= 0) return "Wird gleich aus der Galerie gelöscht";

        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `Wird in ${hours} Std. ${minutes} Min. aus der Galerie gelöscht`;
        } else {
            return `Wird in ${minutes} Min. aus der Galerie gelöscht`;
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
            dialogContentSx={{ padding: { xs: 2, md: 3 } }}
            actionsAdditional={dialogActions}
            actionPrimary={primaryAction}
            actionsShown={true}
        >
            {selectedImage && (
                <PreviewImage
                    key={selectedImage.id}
                    image={selectedImage}
                    details={{
                        columns: { xs: 1, sm: 2 },
                        fields: <>
                            <PreviewField label="Hochgeladen am">
                                <Typography>{formatGermanDateTime(new Date(selectedImage.created_at))}</Typography>
                            </PreviewField>
                            {selectedImage.auto_delete_after_period && (
                                <PreviewField label="Speicherdauer">
                                    <Chip
                                        icon={<AccessTimeIcon />}
                                        label={getTimeUntilDeletion(selectedImage.created_at)}
                                        color="warning"
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            alignSelf: 'flex-start',
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
                                </PreviewField>
                            )}
                        </>,
                    }}
                />
            )}
        </ShareframeMainDialog>
    );
};

export default ImagePreviewDialog;