import ConfirmDialog from '@/common/components/confirmDialog';
import { useAppDispatch, useAppSelector } from "@/store";
import { ISentImage } from "@/types";
import { closeScheduledSentImageDialog, getDialogs } from "@/store/ui/images/images.slice";
import { getApi, getSentImagesPaginated } from "@/store/entities/images/images.slice";
import { cancelScheduledSentImage, sendScheduledSentImageNow } from "@/store/entities/images/images.actions";
import { getUser } from "@/store/entities/authentication/authentication.slice";
import { formatGermanDateTime } from "@/common/components/dateUtils";
import { closePreviewSentImageDialog } from "@/store/ui/sentImages/sentImages.slice";
import { possessive } from "@/common/utils/text/possessive";

const SentImageScheduledActionDialog = () => {
    const dispatch = useAppDispatch();

    const { scheduledAction: scheduledActionDialog } = useAppSelector(getDialogs);
    const sentImagesPaginated = useAppSelector(getSentImagesPaginated);
    const user = useAppSelector(getUser);
    const loading = useAppSelector(getApi).sending
    const sentImage = sentImagesPaginated.results.find((sentImage => sentImage.id === scheduledActionDialog.sentImageId)) as ISentImage | undefined;
    const isSendNow = scheduledActionDialog.action === 'sendNow';

    const receiverFrames = sentImage?.reciever === user.me.username ? "deine" : possessive(sentImage?.reciever ?? "");
    const scheduledFor = sentImage?.scheduled_for ? formatGermanDateTime(new Date(sentImage.scheduled_for)) : null;

    const texts = isSendNow ? {
        title: "Geplantes Foto jetzt senden?",
        body: `Das Foto wird sofort ${scheduledFor ? `statt am ${scheduledFor} ` : ""}an ${receiverFrames} Bilderrahmen gesendet. Die gewählte Anzeigedauer bleibt erhalten.`,
        confirm: "Jetzt senden",
        cancel: "Abbrechen",
    } : {
        title: "Geplantes Senden wirklich abbrechen?",
        body: `Das Foto wird ${scheduledFor ? `am ${scheduledFor} ` : ""}nicht an ${receiverFrames} Bilderrahmen gesendet.`,
        confirm: "Sendung abbrechen",
        // "Abbrechen" next to "Sendung abbrechen" would read as the same choice.
        cancel: "Zurück",
    };

    const handleDialogClose = () => {
        dispatch(closeScheduledSentImageDialog());
    };

    // A failed request resolves with its error message; the preview then stays open.
    const handleConfirm = async () => {
        if (sentImage !== undefined) {
            const result: unknown = await dispatch(isSendNow ? sendScheduledSentImageNow(sentImage.id) : cancelScheduledSentImage(sentImage.id));
            if (typeof result !== "string") dispatch(closePreviewSentImageDialog());
        }
        handleDialogClose();
    };

    return (
        <ConfirmDialog
            open={scheduledActionDialog.open}
            title={texts.title}
            confirmLabel={texts.confirm}
            cancelLabel={texts.cancel}
            destructive={!isSendNow}
            loading={loading}
            onConfirm={handleConfirm}
            onCancel={handleDialogClose}
        >
            {texts.body}
        </ConfirmDialog>
    );
};

export default SentImageScheduledActionDialog;
