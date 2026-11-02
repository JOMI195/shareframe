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

    const actions: DialogAction[] = [
        {
            icon: <SendIcon />,
            onClick: send,
            label: 'Ausgewählte Fotos senden',
            color: 'primary',
        },
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

    const closeDialogAction: DialogAction = {
        icon: <CloseIcon />,
        onClick: cancel,
        color: 'primary',
        label: "Auswahl abbrechen"
    };

    return (
        <BottomFloatingActions
            actionPrimary={closeDialogAction}
            actionsAdditional={actions}
            speedDialDisabled={selectedImages.length === 0}
        />
    );
}

export default SelectionDialog;
