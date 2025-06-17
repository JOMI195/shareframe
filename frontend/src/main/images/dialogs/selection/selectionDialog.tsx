import { Backdrop, Typography, keyframes, Box } from "@mui/material"; // Import Box
import { useState } from "react";
import TouchAppIcon from '@mui/icons-material/TouchApp';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import BottomFloatingActions from "@/common/components/bottomFloatingActions";
import { DialogAction } from "@/types";
import { useAppDispatch, useAppSelector } from "@/store";
import { closeSelectionDialog, getDialogs, openDeleteImageDialog, openSendImageToUserFrameDialog } from "@/store/ui/images/images.slice";
import { downloadImage } from "@/store/entities/images/images.actions";
import { wait } from "@/common/utils/time/timeUtils";

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;

const SelectionDialog = () => {
    const dispatch = useAppDispatch();

    const [backdropOpen, setBackdropOpen] = useState(true);

    const selectedImages = useAppSelector(getDialogs).selection.selectedImages;

    const handleBackdropClose = () => {
        setBackdropOpen(false);
    };

    const handleSendSelectedImagesButtonClicked = () => {
        dispatch(openSendImageToUserFrameDialog());
    };

    const handleDownloadSelectedImagesButtonClicked = async () => {
        for (const selectedImage of selectedImages) {
            await dispatch(downloadImage(`${MEDIA_BASE_URL}${selectedImage.url}`, selectedImage.name));
            await wait(1000); // wait for 1 second between each download
        }
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
            <Backdrop
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",

                    color: '#fff',
                    backdropFilter: 'blur(4px)',
                    zIndex: (theme) => theme.zIndex.drawer + 1
                }}
                open={backdropOpen}
                onClick={handleBackdropClose}
            >
                <Box sx={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
                    <TouchAppIcon
                        sx={{
                            animation: `${keyframes`
                            from { opacity: 1; }
                            to { opacity: 0.3; }
                        `} 1s linear infinite`,
                            animationDuration: '600ms',
                            animationIterationCount: 'infinite',
                            animationDirection: 'alternate',
                            animationTimingFunction: 'ease-in-out',
                            mb: 1,
                        }}
                        fontSize="large"
                    />
                    <Typography variant="h4">
                        {"Fotos durch Klicken aus-/ abwählen"}
                    </Typography>
                </Box>
            </Backdrop>
            <BottomFloatingActions
                actionPrimary={closeDialogAction}
                actionsAdditional={actions}
                speedDialDisabled={selectedImages.length === 0}
            />
        </>
    );
}

export default SelectionDialog;