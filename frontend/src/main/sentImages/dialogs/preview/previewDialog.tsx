import { Dialog, Box } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { closePreviewImageDialog, getDialogs } from "@/store/ui/images/images.slice";
import AuthenticatedImage from "@/common/components/authenticatedImage";


const ImagePreviewDialog = () => {
    const dispatch = useAppDispatch();
    const dialog = useAppSelector(getDialogs).preview;

    const handleCloseImagePreview = () => {
        dispatch(closePreviewImageDialog());
    }

    return (
        <Dialog
            open={dialog.open}
            onClose={handleCloseImagePreview}
            maxWidth="md"
        >
            {dialog.url && (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        width: "100%",
                        height: "100%",
                    }}
                >
                    <AuthenticatedImage
                        url={dialog.url}
                        alt="Preview"
                        style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                        }}
                    />
                </Box>
            )}
        </Dialog>
    );
};

export default ImagePreviewDialog;
