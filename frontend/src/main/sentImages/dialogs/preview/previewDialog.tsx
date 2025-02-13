import { Dialog, Box, useMediaQuery, useTheme, IconButton, Typography, AppBar, Toolbar, DialogContent, Tooltip } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store";
import { closePreviewImageDialog, getDialogs, openDeactivateSendImageFrameDialog } from "@/store/ui/images/images.slice";
import AuthenticatedImage from "@/common/components/authenticatedImage";
import CloseIcon from '@mui/icons-material/Close';
import { SlideTransition, ZoomTransition } from "@/common/components/dialogTransitions";
import HideImageIcon from '@mui/icons-material/HideImage';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { formatGermanDateTime } from "@/common/components/dateUtils";

const MEDIA_BASE_URL = import.meta.env.VITE_API_MEDIA_BASE_URL;

const ImagePreviewDialog = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();

    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const dialog = useAppSelector(getDialogs).preview;
    const selectedImage = dialog.selectedImage;
    const isExpired = (selectedImage && selectedImage.expires_at !== null) ? new Date(selectedImage.expires_at) < new Date() : true;

    const handleCloseImagePreview = () => {
        dispatch(closePreviewImageDialog());
    }

    const disableSentImageButtonClickHandle = (sentImageId: number) => {
        dispatch(openDeactivateSendImageFrameDialog({ sentImageId: sentImageId }))
    }

    const getStatusIcon = (isExpired: boolean) => {
        return isExpired ? (
            <VisibilityOffIcon sx={{ color: theme.palette.error.main, fontSize: '1rem' }} />
        ) : (
            <VisibilityIcon sx={{ color: theme.palette.success.main, fontSize: '1rem' }} />
        );
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
                                    {selectedImage?.name}
                                </Typography>
                                <Typography variant='subtitle2' component='div'>
                                    Sender: {selectedImage?.sender}
                                </Typography>
                                <Typography variant='subtitle2' component='div'>
                                    Empfänger: {selectedImage?.reciever}
                                </Typography>
                                <Typography variant='subtitle2' component='div'>
                                    Gesendet am: {selectedImage?.sent_at}
                                </Typography>
                                <Typography variant='subtitle2' component='div'>
                                    Läuft ab am: {(selectedImage && selectedImage.expires_at !== null) && formatGermanDateTime(new Date(selectedImage.expires_at))}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {getStatusIcon(isExpired)}
                                    <Typography variant="caption">
                                        {isExpired ? 'Abgelaufen' : 'Aktiv'}
                                    </Typography>
                                </Box>
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
                                    <Tooltip title={"Foto deaktivieren"}>
                                        <IconButton
                                            onClick={() => { disableSentImageButtonClickHandle(selectedImage?.id) }}
                                            aria-label="delete"
                                            size="medium"
                                            disabled={isExpired}
                                        >
                                            <HideImageIcon fontSize="inherit" />
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
