import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import BottomFloatingActions from "@/common/components/bottomFloatingActions";
import { useDesktopActions } from "@/hooks/layout/useDesktopActions";
import { DialogAction } from "@/types";
import { useAppSelector } from "@/store";
import { getDialogs } from "@/store/ui/images/images.slice";
import { useSelectionHandlers } from "./useSelectionHandlers";

const SelectionDialog = () => {
    const selectedImages = useAppSelector(getDialogs).selection.selectedImages;
    const { send, download, remove, cancel } = useSelectionHandlers();
    const isDesktop = useDesktopActions();

    if (isDesktop) return null;

    const count = selectedImages.length;

    // Sending is the usual next step, so it gets the big button; cancel stays one tap away.
    const sendAction: DialogAction = {
        icon: <SendIcon />,
        onClick: send,
        label: count > 0 ? `Senden (${count})` : 'Senden',
        color: 'primary',
        disabled: count === 0,
    };

    const cancelAction: DialogAction = {
        icon: <CloseIcon />,
        onClick: cancel,
        tooltip: 'Auswahl abbrechen',
    };

    const actions: DialogAction[] = [
        {
            icon: <DownloadIcon />,
            onClick: download,
            label: 'Ausgewählte Fotos herunterladen',
            color: 'primary',
        },
        {
            icon: <DeleteIcon />,
            onClick: remove,
            label: 'Ausgewählte Fotos löschen',
            color: 'error',
        }
    ]

    return (
        <BottomFloatingActions
            actionPrimary={sendAction}
            actionSecondary={cancelAction}
            actionsAdditional={actions}
            speedDialDisabled={count === 0}
        />
    );
}

export default SelectionDialog;
