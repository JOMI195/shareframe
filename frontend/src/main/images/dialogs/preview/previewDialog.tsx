import { Dialog, Box, useMediaQuery, useTheme, IconButton, Typography, AppBar, Toolbar, DialogTitle, DialogContent, Tooltip } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { closePreviewImageDialog, getDialogs, openDeleteImageDialog, openSendImageToUserFrameDialog } from "@/store/ui/images/images.slice";
import AuthenticatedImage from "@/common/components/authenticatedImage";
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;

const ImagePreviewDialog = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const dialog = useAppSelector(getDialogs).preview;

    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const selectedImage = dialog.selectedImage;

    const handleCloseImagePreview = () => {
        dispatch(closePreviewImageDialog());
    }

    const handleDelete = (image: { id: number }) => {
        dispatch(openDeleteImageDialog({ imageId: image.id }));
    };

    const handleSend = (image: { id: number }) => {
        dispatch(openSendImageToUserFrameDialog({ imageId: image.id }));
    };

    return (
        <Dialog
            open={dialog.open}
            onClose={handleCloseImagePreview}
            TransitionComponent={!isSmallScreen ? ZoomTransition : SlideTransition}
            maxWidth="xl"
            fullWidth
            fullScreen={isSmallScreen}
        >
            {selectedImage && (
                <>
                    <AppBar sx={{ position: 'relative', py: 1 }} color='inherit'>
                        <Toolbar>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant='h6' component='div'>
                                    {selectedImage.name}
                                </Typography>
                                <Typography variant='subtitle2' component='div'>
                                    {selectedImage.created_at}
                                </Typography>
                            </Box>

                            <IconButton
                                edge='start'
                                color='inherit'
                                onClick={handleCloseImagePreview}
                                aria-label='cancel'
                            >
                                <CloseIcon />
                            </IconButton>
                        </Toolbar>
                    </AppBar>
                    <DialogTitle sx={{ m: 0, pl: 3, pr: 5 }}>
                        <IconButton
                            aria-label="close"
                            onClick={closePreviewImageDialog}
                            sx={{
                                position: "absolute",
                                right: 8,
                                top: 8,
                                color: (theme) => theme.palette.grey[500],
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent>
                        <Box display="flex" flexDirection="column" alignItems="center">
                            <AuthenticatedImage
                                url={`${MEDIA_BASE_URL}${selectedImage.url}`}
                                alt={selectedImage.name}
                                style={{ maxWidth: "100%", maxHeight: "60vh", borderRadius: 8 }}
                            />
                            <Box mt={2}>
                                <Toolbar
                                    sx={{
                                        justifyContent: "flex-end",
                                        backgroundColor: (theme) => theme.palette.background.default,
                                        borderRadius: 1,
                                    }}
                                >
                                    <Tooltip title="Foto löschen">
                                        <IconButton onClick={() => handleDelete(selectedImage)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Foto senden">
                                        <IconButton onClick={() => handleSend(selectedImage)}>
                                            <SendIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Toolbar>
                            </Box>
                        </Box>
                    </DialogContent>
                </>
            )}
        </Dialog>
    );
};

export default ImagePreviewDialog;
