import React from 'react';
import {
    Box,
    Button,
    List,
    ListItemText,
    IconButton,
    Chip,
    LinearProgress,
    ListItemButton,
    Grid,
    Typography,
    useMediaQuery,
    useTheme,
    Avatar
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CropIcon from '@mui/icons-material/Crop';
import { Area } from 'react-easy-crop';
import Cropper from './cropper/cropper';
import { getReadablyFileSize } from '@/common/utils/files/fileSize.helpers';
import { ImageStatus } from '../uploadDialog';

interface ImageCroppingProps {
    imageStatuses: ImageStatus[];
    currentImageIndex: number | null;
    selectImageForCropping: (index: number) => void;
    setCroppedAreaPixels: React.Dispatch<React.SetStateAction<Area>>;
    rotation: number;
    setRotation: React.Dispatch<React.SetStateAction<number>>;
    handleCropAndUpload: (index: number) => Promise<void>;
    handleDialogClose: () => void;
    handleBack: () => void;
    allImagesUploaded: boolean;
    sending: boolean;
    imagePreviews: { [id: string]: string };
}

const ImageCropping: React.FC<ImageCroppingProps> = ({
    imageStatuses,
    currentImageIndex,
    selectImageForCropping,
    setCroppedAreaPixels,
    rotation,
    setRotation,
    handleCropAndUpload,
    handleDialogClose,
    handleBack,
    allImagesUploaded,
    sending,
    imagePreviews
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const imageListRef = React.useRef<HTMLUListElement>(null);

    const totalImages = imageStatuses.length;
    const uploadedImagesCount = imageStatuses.filter(status => status.status === 'uploaded').length;

    const currentImage = currentImageIndex !== null ? imageStatuses[currentImageIndex] : null;

    const handleScrollToImages = () => {
        if (imageListRef.current) {
            imageListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <Box sx={{ my: 2 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} md={5}>
                    <Box>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                            Fotos: {uploadedImagesCount}/{totalImages} hochgeladen
                        </Typography>
                        <LinearProgress variant="determinate" value={(uploadedImagesCount / totalImages) * 100} sx={{ mb: 2 }} />
                        <List component="ul" dense sx={{ maxHeight: 300, overflow: 'auto' }} ref={imageListRef}>
                            {imageStatuses.map((imageStatus, index) => (
                                <ListItemButton
                                    key={imageStatus.id}
                                    onClick={() => selectImageForCropping(index)}
                                    selected={currentImageIndex === index}
                                    disabled={imageStatus.status === 'uploaded'}
                                    sx={{
                                        mb: 1,
                                        borderRadius: 1,
                                        bgcolor: currentImageIndex === index ? 'primary.light' : (imageStatus.status === 'uploaded' ? 'success.light' : 'background.paper'),
                                        boxShadow: 1
                                    }}
                                >
                                    <Chip
                                        label={index + 1}
                                        size="small"
                                        sx={{ mr: 1, bgcolor: 'primary.main', color: 'primary.contrastText' }}
                                    />
                                    {imagePreviews[imageStatus.id] && (
                                        <Avatar
                                            src={imagePreviews[imageStatus.id]}
                                            variant="square"
                                            sx={{ width: 40, height: 40, mr: 1, objectFit: 'cover' }}
                                        />
                                    )}
                                    <ListItemText
                                        primary={imageStatus.file.name}
                                        secondary={getReadablyFileSize(imageStatus.file.size)}
                                    />
                                    {imageStatus.status === 'uploaded' && (
                                        <IconButton edge="end" aria-label="uploaded" size="small" color="success">
                                            <CheckCircleIcon />
                                        </IconButton>
                                    )}
                                    {imageStatus.status === 'cropping' && (
                                        <IconButton edge="end" aria-label="cropping" size="small" color="primary">
                                            <CropIcon />
                                        </IconButton>
                                    )}
                                </ListItemButton>
                            ))}
                        </List>
                    </Box>
                </Grid>

                <Grid item xs={12} md={7}>
                    <Box sx={{ maxHeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {currentImage && (
                            <Cropper
                                image={currentImage.file}
                                setCroppedAreaPixels={setCroppedAreaPixels}
                                rotation={rotation}
                                setRotation={setRotation}
                            />
                        )}
                        {!currentImage && (
                            <Typography variant="body2" color="text.secondary">
                                Keine Fotos zum Zuschneiden ausgewählt.
                            </Typography>
                        )}
                    </Box>
                </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mt: { xs: 0, md: 10 }, alignItems: "center" }}>
                {currentImage && (
                    <Grid item xs={12} md={6} order={{ xs: 1, md: 3 }}>
                        <Button
                            variant="contained"
                            fullWidth
                            disabled={sending}
                            onClick={() => handleCropAndUpload(currentImageIndex!)}
                        >
                            Zuschneiden & Hochladen
                        </Button>
                    </Grid>
                )}
                {isMobile && (
                    <Grid item xs={12} order={{ xs: 2, md: 1 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={handleScrollToImages}
                        >
                            Zur Fotosübersicht scrollen
                        </Button>
                    </Grid>
                )}
                <Grid item xs={12} md={3} order={{ xs: 3, md: 2 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleBack}
                    >
                        Zurück zur Fotoauswahl
                    </Button>
                </Grid>
                {allImagesUploaded && (
                    <Grid item xs={12} md={3} order={{ xs: 4, md: 1 }}>
                        <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            onClick={handleDialogClose}
                        >
                            Alle Bilder hochgeladen - Fertig
                        </Button>
                    </Grid>
                )}
                {!allImagesUploaded && (
                    <Grid item xs={12} md={3} order={{ xs: 5, md: 1 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={handleDialogClose}
                            sx={{ order: { xs: 4, sm: 4 } }}
                        >
                            Dialog schließen
                        </Button>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default ImageCropping;