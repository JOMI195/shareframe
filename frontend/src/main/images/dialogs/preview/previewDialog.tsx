import { Dialog, Box, useMediaQuery, useTheme, IconButton, Typography, AppBar, Toolbar, DialogContent, Tooltip } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { closePreviewImageDialog, getDialogs, openDeleteImageDialog, openSendImageToUserFrameDialog } from "@/store/ui/images/images.slice";
import AuthenticatedImage from "@/common/components/authenticatedImage";
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";
import { downloadImage } from "@/store/entities/images/images.actions";

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;

const ImagePreviewDialog = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const dialog = useAppSelector(getDialogs).preview;
    const selectedImage = dialog.selectedImage;

    const handleCloseImagePreview = () => {
        dispatch(closePreviewImageDialog());
    }

    const handleDelete = () => {
        if (selectedImage !== null) {
            dispatch(openDeleteImageDialog({ imageId: selectedImage.id }));
        }
    };

    const handleSend = () => {
        if (selectedImage !== null) {
            dispatch(openSendImageToUserFrameDialog({ imageId: selectedImage.id }));
        }
    };

    const handleDownloadFileButtonClick = () => {
        if (selectedImage !== null) {
            dispatch(downloadImage(`${MEDIA_BASE_URL}${selectedImage.url}`, selectedImage.name))
        }
    }

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
                                    {selectedImage?.name}
                                </Typography>
                                <Typography variant='subtitle2' component='div'>
                                    {selectedImage?.created_at}
                                </Typography>
                            </Box>

                            <IconButton
                                edge='start'
                                color='inherit'
                                onClick={handleCloseImagePreview}
                                aria-label='cancel'
                                sx={{ alignSelf: "flex-start" }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Toolbar>
                    </AppBar>
                    <DialogContent>
                        <Box display="flex" flexDirection="column" alignItems="center">
                            <AuthenticatedImage
                                url={`${MEDIA_BASE_URL}${selectedImage?.url}`}
                                alt={selectedImage?.name}
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
                                    <Tooltip title="Foto senden">
                                        <IconButton onClick={handleSend}>
                                            <SendIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title={"Foto herunterladen"}>
                                        <IconButton onClick={handleDownloadFileButtonClick}>
                                            <DownloadIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Foto löschen">
                                        <IconButton color="error" onClick={handleDelete}>
                                            <DeleteIcon />
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
