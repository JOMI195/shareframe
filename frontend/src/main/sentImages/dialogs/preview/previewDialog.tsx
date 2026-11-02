import { Typography, Stack } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { openDeactivateSendImageFrameDialog, openScheduledSentImageDialog, ScheduledSentImageAction } from "@/store/ui/images/images.slice";
import HideImageIcon from '@mui/icons-material/HideImage';
import DownloadIcon from '@mui/icons-material/Download';
import SendIcon from '@mui/icons-material/Send';
import CancelScheduleSendIcon from '@mui/icons-material/CancelScheduleSend';
import { formatGermanDateTime } from "@/common/components/dateUtils";
import { downloadImage } from "@/store/entities/images/images.actions";
import ShareframeMainDialog from "@/common/components/shareframeMainDialog";
import { DialogAction } from "@/types";
import { closePreviewSentImageDialog, getDialogs } from "@/store/ui/sentImages/sentImages.slice";
import PreviewImage from "@/main/images/dialogs/preview/previewImage";
import { PreviewField } from "@/main/images/dialogs/preview/previewLayout";
import { formatDuration, getActiveDurationMs, getSentImageState } from "../../sentImageStatus";
import SentImageStatusLabel from "../../sentImageStatusLabel";
import UserAvatar from "@/common/components/userAvatar";
import { getUser } from "@/store/entities/authentication/authentication.slice";

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;

const PreviewUser: React.FC<{ username: string; avatar?: string | null }> = ({ username, avatar }) => (
    <Stack direction="row" sx={{ alignItems: "center", gap: 1, minWidth: 0 }}>
        <UserAvatar username={username} url={avatar} size={36} />
        <Typography noWrap>{username}</Typography>
    </Stack>
);

const ImagePreviewDialog = () => {
    const dispatch = useAppDispatch();

    const dialog = useAppSelector(getDialogs).preview;
    const selectedImage = dialog.selectedSentImage;
    const state = selectedImage ? getSentImageState(selectedImage) : 'expired';
    const isScheduled = state === 'scheduled';
    const activeDurationMs = selectedImage ? getActiveDurationMs(selectedImage) : null;
    const me = useAppSelector(getUser).me.username;
    const received = selectedImage !== null && selectedImage.sender !== me;

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

    const downloadAction: DialogAction = {
        icon: <DownloadIcon />,
        onClick: handleDownloadFileButtonClick,
        label: 'Foto herunterladen',
        color: 'primary',
    };

    // What can still change comes first; downloading is always possible.
    const [primaryAction, ...dialogActions]: DialogAction[] = isScheduled ? [
        {
            icon: <CancelScheduleSendIcon />,
            onClick: () => openScheduledActionDialog('cancel'),
            label: 'Geplantes Senden abbrechen',
            color: 'error'
        },
        {
            icon: <SendIcon />,
            onClick: () => openScheduledActionDialog('sendNow'),
            label: 'Jetzt senden',
            color: 'primary'
        },
        downloadAction,
    ] : state === 'active' ? [
        {
            icon: <HideImageIcon />,
            onClick: disableSentImageButtonClickHandle,
            label: 'Foto deaktivieren',
            color: 'error'
        },
        downloadAction,
    ] : [downloadAction];

    return (
        <ShareframeMainDialog
            open={dialog.open}
            onDialogClose={handleCloseImagePreview}
            dialogTitle={received ? "Erhaltenes Foto" : "Gesendetes Foto"}
            dialogContentSx={{ padding: { xs: 2, md: 3 } }}
            actionsAdditional={dialogActions}
            actionPrimary={primaryAction}
            actionsShown={true}
        >
            {selectedImage && (
                <PreviewImage
                    key={selectedImage.id}
                    image={selectedImage.image}
                    details={{
                        columns: { xs: 2, sm: 3 },
                        fields: <>
                            <PreviewField label="Absender">
                                <PreviewUser username={selectedImage.sender} avatar={selectedImage.sender_avatar} />
                            </PreviewField>
                            <PreviewField label="Empfänger">
                                <PreviewUser username={selectedImage.reciever} avatar={selectedImage.reciever_avatar} />
                            </PreviewField>
                            <PreviewField label={isScheduled ? "Geplant für" : "Gesendet am"}>
                                <Typography>{formatGermanDateTime(new Date(isScheduled && selectedImage.scheduled_for ? selectedImage.scheduled_for : selectedImage.sent_at))}</Typography>
                            </PreviewField>
                            <PreviewField label="Läuft ab am">
                                <Typography>{selectedImage.expires_at !== null ? formatGermanDateTime(new Date(selectedImage.expires_at)) : "–"}</Typography>
                            </PreviewField>
                            <PreviewField label="Anzeigedauer">
                                <Typography>{activeDurationMs !== null ? formatDuration(activeDurationMs) : "–"}</Typography>
                            </PreviewField>
                            <PreviewField label="Status">
                                <SentImageStatusLabel state={state} />
                            </PreviewField>
                        </>,
                    }}
                />
            )}
        </ShareframeMainDialog>
    );
};

export default ImagePreviewDialog;
