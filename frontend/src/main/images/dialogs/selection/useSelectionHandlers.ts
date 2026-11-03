import { useAppDispatch, useAppSelector } from "@/store";
import { closeImagesLoadingSnackbar, closeSelectionDialog, getDialogs, openDeleteImageDialog, openImagesLoadingSnackbar, openSendImageToUserFrameDialog } from "@/store/ui/images/images.slice";
import { downloadImage } from "@/store/entities/images/images.actions";
import { wait } from "@/common/utils/time/timeUtils";

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;

export const useSelectionHandlers = () => {
    const dispatch = useAppDispatch();
    const selectedImages = useAppSelector(getDialogs).selection.selectedImages;

    const send = () => {
        dispatch(openSendImageToUserFrameDialog());
    };

    const download = async () => {
        for (const [index, selectedImage] of selectedImages.entries()) {
            dispatch(openImagesLoadingSnackbar({ message: `Foto ${index + 1} von ${selectedImages.length} wird heruntergeladen` }));
            await dispatch(downloadImage(`${MEDIA_BASE_URL}${selectedImage.url}`, selectedImage.name));
            // Browsers drop downloads that start too close together.
            await wait(1000);
        }
        dispatch(closeImagesLoadingSnackbar());
        dispatch(closeSelectionDialog());
    };

    const remove = () => {
        dispatch(openDeleteImageDialog());
    };

    const cancel = () => {
        dispatch(closeSelectionDialog());
    };

    return { send, download, remove, cancel };
};
