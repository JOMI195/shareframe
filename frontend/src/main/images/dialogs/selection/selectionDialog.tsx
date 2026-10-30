import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import BottomFloatingActions from "@/common/components/bottomFloatingActions";
import { DialogAction } from "@/types";
import { useAppDispatch, useAppSelector } from "@/store";
import { closeImagesLoadingSnackbar, closeSelectionDialog, getDialogs, openDeleteImageDialog, openImagesLoadingSnackbar, openSendImageToUserFrameDialog } from "@/store/ui/images/images.slice";
import { downloadImage } from "@/store/entities/images/images.actions";
import { wait } from "@/common/utils/time/timeUtils";

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;

const SelectionDialog = () => {
    const dispatch = useAppDispatch();

    const selectedImages = useAppSelector(getDialogs).selection.selectedImages;

    const handleSendSelectedImagesButtonClicked = () => {
        dispatch(openSendImageToUserFrameDialog());
    };

    const handleDownloadSelectedImagesButtonClicked = async () => {
        for (const [index, selectedImage] of selectedImages.entries()) {
            dispatch(openImagesLoadingSnackbar({ message: `Foto ${index + 1} von ${selectedImages.length} wird heruntergeladen` }));
            await dispatch(downloadImage(`${MEDIA_BASE_URL}${selectedImage.url}`, selectedImage.name));
            // Browsers drop downloads that start too close together.
            await wait(1000);
        }
        dispatch(closeImagesLoadingSnackbar());
        dispatch(closeSelectionDialog());
    };

    const handleDelecteSelectedImagesButtonClicked = () => {
        dispatch(openDeleteImageDialog());
    };

    const handleCloseDialogButtonClicked = () => {
        dispatch(closeSelectionDialog());
    };

    const actions: DialogAction[] = [
        {
            icon: <SendIcon />,
            onClick: handleSendSelectedImagesButtonClicked,
            label: 'Ausgewählte Fotos senden',
            color: 'primary',
        },
        {
            icon: <DownloadIcon />,
            onClick: handleDownloadSelectedImagesButtonClicked,
            label: 'Ausgewählte Fotos herunterladen',
            color: 'primary',
        },
        {
            icon: <DeleteIcon />,
            onClick: handleDelecteSelectedImagesButtonClicked,
            label: 'Ausgewählte Fotos löschen',
            color: 'error',
        }
    ]

    const closeDialogAction: DialogAction = {
        icon: <CloseIcon />,
        onClick: handleCloseDialogButtonClicked,
        color: 'primary',
        label: "Auswahl abbrechen"
    };

    return (
        <>
            <BottomFloatingActions
                actionPrimary={closeDialogAction}
                actionsAdditional={actions}
                speedDialDisabled={selectedImages.length === 0}
            />
        </>
    );
}

export default SelectionDialog;