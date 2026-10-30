import ConfirmDialog from '@/common/components/confirmDialog';
import { useAppDispatch, useAppSelector } from "@/store";
import { IFrame, isIFrameResponse } from "@/types";
import { getApi, getFrames } from "@/store/entities/frames/frames.slice";
import { closeUnregisterFrameDialog, getDialogs } from "@/store/ui/frames/frames.slice";
import { unregisterFrame } from "@/store/entities/frames/frames.actions";

const UnregisterFrameDialog = () => {
    const dispatch = useAppDispatch();

    const { unregister: unregisterDialog } = useAppSelector(getDialogs);
    const frames = useAppSelector(getFrames);
    const loading = useAppSelector(getApi).loading
    const frameToUnregister = frames.find((frame => frame.id === unregisterDialog.frameId)) as IFrame | undefined;

    const handleDialogClose = () => {
        dispatch(closeUnregisterFrameDialog());
    };

    const handleConfirmUnregister = async () => {
        if (frameToUnregister !== undefined) {
            const unregisteredFrame = await dispatch(unregisterFrame(frameToUnregister.public_serial_number))
            if (isIFrameResponse(unregisteredFrame)) {
                handleDialogClose();
            }
        }
    };

    return (
        <ConfirmDialog
            open={unregisterDialog.open}
            title="Bilderrahmen wirklich entfernen?"
            confirmLabel="Entfernen"
            destructive
            loading={loading}
            onConfirm={handleConfirmUnregister}
            onCancel={handleDialogClose}
        >
            Du kannst den Bilderrahmen jederzeit wieder mit seiner Seriennummer hinzufügen.
        </ConfirmDialog>
    );
};

export default UnregisterFrameDialog;
