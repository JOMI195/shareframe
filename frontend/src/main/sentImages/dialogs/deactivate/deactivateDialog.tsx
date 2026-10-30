import ConfirmDialog from '@/common/components/confirmDialog';
import { useAppDispatch, useAppSelector } from "@/store";
import { ISentImage } from "@/types";
import { closeDeactivateSendImageFrameDialog, getDialogs } from "@/store/ui/images/images.slice";
import { getApi, getSentImagesPaginated } from "@/store/entities/images/images.slice";
import { deactivateSentImage } from "@/store/entities/images/images.actions";
import { getUser } from "@/store/entities/authentication/authentication.slice";
import { closePreviewSentImageDialog } from "@/store/ui/sentImages/sentImages.slice";

const SentImageDeactivateDialog = () => {
    const dispatch = useAppDispatch();

    const { deactivate: deactivateDialog } = useAppSelector(getDialogs);
    const sentImagesPaginated = useAppSelector(getSentImagesPaginated);
    const user = useAppSelector(getUser);
    const loading = useAppSelector(getApi).sending
    const sentImageToDeactivate = sentImagesPaginated.results.find((sentImage => sentImage.id === deactivateDialog.sentImageId)) as ISentImage | undefined;

    const handleDialogClose = () => {
        dispatch(closeDeactivateSendImageFrameDialog());
    };

    // A failed request resolves with its error message; the preview then stays open.
    const handleConfirmDeactivate = async () => {
        if (sentImageToDeactivate !== undefined) {
            const result: unknown = await dispatch(deactivateSentImage(sentImageToDeactivate.id));
            if (typeof result !== "string") dispatch(closePreviewSentImageDialog());
        }
        handleDialogClose();
    };

    return (
        <ConfirmDialog
            open={deactivateDialog.open}
            title="Gesendetes Foto wirklich deaktivieren?"
            confirmLabel="Deaktivieren"
            destructive
            loading={loading}
            onConfirm={handleConfirmDeactivate}
            onCancel={handleDialogClose}
        >
            {`Bei einer Deaktivierung wird das gesendete Foto umgehend von ${sentImageToDeactivate?.reciever === user.me.username ? "deinen" : `${sentImageToDeactivate?.reciever}s`} Bilderrahmen entfernt und dort nicht mehr angezeigt.`}
        </ConfirmDialog>
    );
};

export default SentImageDeactivateDialog;
